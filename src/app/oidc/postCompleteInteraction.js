const oidc = require('./oidcServer');
const config = require('./../../infrastructure/Config');
const logger = require('./../../infrastructure/logger');
const RequestVerification = require('login.dfe.request-verification');
const interactions = require('./../interactions');

const postCompleteInteraction = async (req, res) => {
  const contents = JSON.stringify({ uuid: req.params.grant, uid: req.body.uid });

  if (config.requestVerification.isEnabled) {
    const requestVerification = new RequestVerification();
    const verified = requestVerification.verifyRequest(
      contents, config.requestVerification.cert, req.body.sig);
    if (!verified) {
      oidc.interactionFinished(req, res, {});
      return;
    }
  }

  if (req.body.status === 'failed') {
    interactions.render(res, 'loginerror', { reason: req.body.reason });
    return;
  } else if (req.body.status === 'cancelled') {
    oidc.interactionFinished(req, res, {});
    return;
  }

  logger.info(`completing interaction for ${req.body.type}`);
  await oidc.interactionFinished(req, res, {
    login: {
      account: req.body.uid, // becomes token
      acr: '1',
      // remember: !!req.body.remember,
      ts: Math.floor(Date.now() / 1000),
    },
    consent: {
      // TODO: remove offline_access from scopes if remember is not checked
    },
    meta: {
      interactionCompleted: req.body.type,
    },
  });
};

module.exports = postCompleteInteraction;
