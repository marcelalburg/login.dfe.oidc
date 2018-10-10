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
const developmentViews = require('./app/dev');
const clientManagement = require('./app/clientManagement');
const oidc = require('./app/oidc');
const helmet = require('helmet');
const healthCheck = require('login.dfe.healthcheck');
const { getErrorHandler, ejsErrorPages } = require('login.dfe.express-error-handling');
const KeepAliveAgent = require('agentkeepalive');



const { oidcSchema, validateConfig } = require('login.dfe.config.schema');

validateConfig(oidcSchema, config, logger, true);

http.GlobalAgent = new KeepAliveAgent({
  maxSockets: config.hostingEnvironment.agentKeepAlive.maxSockets,
  maxFreeSockets: config.hostingEnvironment.agentKeepAlive.maxFreeSockets,
  timeout: config.hostingEnvironment.agentKeepAlive.timeout,
  keepAliveTimeout: config.hostingEnvironment.agentKeepAlive.keepAliveTimeout,
});
https.GlobalAgent = new KeepAliveAgent({
  maxSockets: config.hostingEnvironment.agentKeepAlive.maxSockets,
  maxFreeSockets: config.hostingEnvironment.agentKeepAlive.maxFreeSockets,
  timeout: config.hostingEnvironment.agentKeepAlive.timeout,
  keepAliveTimeout: config.hostingEnvironment.agentKeepAlive.keepAliveTimeout,
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
  } else if (config.hostingEnvironment.env === 'docker') {
    app.listen(config.hostingEnvironment.port, () => {
      logger.info(`Server listening on http://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}`);
    });
  } else {
    app.listen(process.env.PORT, () => {
      logger.info(`Server listening on http://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}`);
    });
  }
})
  .catch((e) => {
    logger.info(e);
  });
