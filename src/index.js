'use strict';

// see previous example for the things that are not commented
const config = require('./infrastructure/Config');
const logger = require('./infrastructure/logger');
const fs = require('fs');
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


const { oidcSchema, validateConfigAndQuitOnError } = require('login.dfe.config.schema');

validateConfigAndQuitOnError(oidcSchema, config, logger);


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

oidc.initialize(app).then(() => {
  app.set('trust proxy', true);
  app.set('view engine', 'ejs');
  app.set('views', path.resolve(__dirname, 'app'));

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
