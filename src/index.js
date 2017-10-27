'use strict';

// see previous example for the things that are not commented
const Provider = require('oidc-provider');
const fs = require('fs');
const https = require('https');
const path = require('path');
const express = require('express');
const adapter = require('./adapters/MasterAdapter');
const useOidc = require('./oidc');
const config = require('./Config');
const morgan = require('morgan');
const winston = require('winston');
const uuid = require('uuid/v4');
const developmentViews = require('./dev');
const clientManagement = require('./clientManagement');
const Accounts = require('./Accounts');
const logoutAction = require('./logout');

const app = express();
const logger = new (winston.Logger)({
  colors: config.loggerSettings.colors,
  transports: [
    new (winston.transports.Console)({ level: 'info', colorize: true }),
  ],
});


app.set('logger', logger);
app.use(morgan('combined', { stream: fs.createWriteStream('./access.log', { flags: 'a' }) }));
app.use(morgan('dev'));


// TODO : Work out the URL based on the ENV...
const oidc = new Provider(`${config.hostingEnvironment.protocol}://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}`, {
  clientCacheDuration: 60,
  logoutSource: logoutAction,
  findById: Accounts.findById,
  claims: {
    // scope: [claims] format
    openid: ['sub'],
    email: ['email'],
    profile: ['email', 'given_name', 'family_name'],
  },
  interactionUrl(ctx) {
    return `/interaction/${ctx.oidc.uuid}`;
  },
  async interactionCheck(ctx) {
    if (!ctx.oidc.session.sidFor(ctx.oidc.client.clientId)) {
      const sid = uuid();
      ctx.oidc.session.sidFor(ctx.oidc.client.clientId, sid);
      await ctx.oidc.session.save();
    }

    return false;
  },
  // TODO deployment configuration
  features: {
    // disable the packaged interactions
    devInteractions: false,
    claimsParameter: true,
    clientCredentials: true,
    discovery: true,
    encryption: true,
    introspection: true,
    registration: true,
    request: true,
    requestUri: true,
    revocation: true,
    rejectUnauthorized: false,
    sessionManagement: true,
  },
});

const keystore = config.oidc.keyStore;
if (config.hostingEnvironment.showDevViews === 'true') {
  app.use(developmentViews);
}
if (config.clientManagement.enabled) {
  app.use('/manage-client', clientManagement(oidc));
}

oidc.initialize({
  keystore,
  adapter,
}).then(() => {
  app.proxy = true;
  app.keys = config.oidc.secureKey.split(',');
}).then(() => {
  app.set('trust proxy', true);
  app.set('view engine', 'ejs');
  app.set('views', path.resolve(__dirname, 'views'));
  useOidc(app, oidc);
}).then(() => {
  const isDev = config.hostingEnvironment.env === 'dev';
  const port = config.hostingEnvironment.port;

  if (isDev) {
    const options = {
      key: config.hostingEnvironment.sslKey,
      cert: config.hostingEnvironment.sslCert,
      requestCert: false,
      rejectUnauthorized: false,
    };

    const server = https.createServer(options, app);

    server.listen(port, () => {
      logger.info(`Dev server listening on https://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}`);
    });
  } else {
    app.listen(process.env.PORT);
  }
})
  .catch((e) => {
    logger.info(e);
  });


process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at:', p, 'reason:', reason);
});