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
const oidc = new Provider(`https://${process.env.HOST}:${process.env.PORT}`, {
  clientCacheDuration: 60,
  interactionUrl(ctx) {
    return `/interaction/${ctx.oidc.uuid}`;
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
    sessionManagement: true
  }
});

// TODO : Work out a better way of managing Keys when not in Dev...
const keystore = require('./keystore.json');

oidc.initialize({

  keystore,
  adapter,
}).then(() => {
  app.proxy = true;
  app.keys = process.env.SECURE_KEY.split(',');
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
      key: (process.env.NODE_ENV === undefined || process.env.NODE_ENV === 'dev') ? fs.readFileSync('./ssl/localhost.key') : null,
      cert: (process.env.NODE_ENV === undefined || process.env.NODE_ENV === 'dev') ? fs.readFileSync('./ssl/localhost.cert') : null,
      requestCert: false,
      rejectUnauthorized: false
    };

    const server = https.createServer(options, app);

    server.listen(port, () => {
      logger.info(`Dev server listening on https://${process.env.HOST}:${process.env.PORT}`);
    });
  } else {
    app.listen(process.env.PORT);
  }
})
  .catch((e) => {
    logger.info(e);
  });
