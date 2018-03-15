'use strict';

// see previous example for the things that are not commented
const config = require('./infrastructure/Config');
const logger = require('./infrastructure/logger');
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const express = require('express');
const setCorrelationId = require('express-mw-correlation-id');
const morgan = require('morgan');
const developmentViews = require('./app/dev');
const clientManagement = require('./app/clientManagement');
const oidc = require('./app/oidc');
const helmet = require('helmet');
const healthCheck = require('login.dfe.healthcheck');
const { getErrorHandler, ejsErrorPages } = require('login.dfe.express-error-handling');
const KeepAliveAgent = require('agentkeepalive');


const { oidcSchema, validateConfig } = require('login.dfe.config.schema');

validateConfig(oidcSchema, config, logger, config.hostingEnvironment.env !== 'dev');

http.GlobalAgent = new KeepAliveAgent({
  maxSockets: 160,
  maxFreeSockets: 10,
  timeout: 60000,
  keepAliveTimeout: 300000,
});
https.GlobalAgent = new KeepAliveAgent({
  maxSockets: 160,
  maxFreeSockets: 10,
  timeout: 60000,
  keepAliveTimeout: 300000,
});

const app = express();
app.use(helmet({
  noCache: true,
  frameguard: {
    action: 'deny',
  },
}));

app.use(setCorrelationId(true));
app.set('logger', logger);
app.use(morgan('combined', { stream: fs.createWriteStream('./access.log', { flags: 'a' }) }));
app.use(morgan('dev'));

if (config.hostingEnvironment.useDevViews === true) {
  app.use(developmentViews);
}
if (config.clientManagement.enabled) {
  app.use('/manage-client', clientManagement(oidc));
}
app.use('/healthcheck', healthCheck({ config }));


oidc.initialize(app).then((provider) => {
  app.set('trust proxy', true);
  app.set('view engine', 'ejs');
  app.set('views', path.resolve(__dirname, 'app'));

  // eslint-disable-next-line no-param-reassign
  provider.app.proxy = true;

  const errorPageRenderer = ejsErrorPages.getErrorPageRenderer({
    help: config.hostingEnvironment.helpUrl,
  }, config.hostingEnvironment.env === 'dev');
  app.use(getErrorHandler({
    logger,
    errorPageRenderer,
  }));

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
    app.listen(process.env.PORT, () => {
      logger.info(`Dev server listening on http://localhost:${process.env.PORT}`);
    });
  }
})
  .catch((e) => {
    logger.info(e);
  });
