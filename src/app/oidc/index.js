/* eslint-disable no-param-reassign */
const bodyParser = require('body-parser');
const config = require('./../../infrastructure/Config');
const logger = require('./../../infrastructure/logger');
const adapter = require('./../../infrastructure/adapters/MasterAdapter');
const { asyncWrapper } = require('login.dfe.express-error-handling');

const oidc = require('./oidcServer');
const getInteraction = require('./getInteraction');
const getConfirmInteraction = require('./getConfirmInteraction');
const getDevUsernamePassword = require('./getDevUsernamePassword');
const getDevDigipass = require('./getDevDigipass');
const getDevSelectOrg = require('./getDevSelectOrg');
const postCompleteInteraction = require('./postCompleteInteraction');

const initialize = (app) => {
  logger.info('initializing oidc');
  const keystore = config.oidc.keyStore;

  return oidc.initialize({
    keystore,
    adapter,
  }).then((provider) => {
    app.proxy = true;
    app.keys = config.oidc.secureKey.split(',');

    const parse = bodyParser.urlencoded({ extended: false });

    app.get('/interaction/:grant', asyncWrapper(getInteraction));
    app.post('/interaction/:grant/confirm', parse, asyncWrapper(getConfirmInteraction));
    app.post('/interaction/:grant/complete', parse, asyncWrapper(postCompleteInteraction));

    app.get('/:uuid/usernamepassword', asyncWrapper(getDevUsernamePassword));
    app.get('/:uuid/digipass', asyncWrapper(getDevDigipass));
    app.get('/:uuid/select-organisation', asyncWrapper(getDevSelectOrg));
    app.use(oidc.callback);
    return provider;
  });


};

const clearClientCache = () => {
  oidc.Client.cacheClear();
};

module.exports = {
  initialize,
  clearClientCache,
};
