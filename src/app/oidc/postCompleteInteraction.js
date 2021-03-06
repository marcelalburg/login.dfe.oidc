const oidc = require('./oidcServer');
const config = require('./../../infrastructure/Config');
const logger = require('./../../infrastructure/logger');
const RequestVerification = require('login.dfe.request-verification');
const interactions = require('./../interactions');
const applicationsApi = require('./../../infrastructure/applications/api');


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

  if (req.body.type === 'gias-lockout-check') {
    const session = await oidc.Session.find(req.params.grant);
    if (session.interaction.oid !== req.body.oid || session.interaction.uid !== req.body.uid) {
      oidc.interactionFinished(req, res, {});
      return;
    }
  }

  logger.info(`completing interaction for ${req.body.type}`);

  const meta = {};
  if (req.body.type === 'select-organisation') {
    meta.organisation = JSON.parse(decodeURIComponent(req.body.organisation));
  }
  if (req.body.type === 'consent') {
    meta.organisations = JSON.parse(decodeURIComponent(req.body.organisations));
  }

  try {
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
        ...meta,
      },
    });
    return;
  } catch (e) {
    logger.warn(`Possible interaction timeout, redirect to RP - ${e.message}`);
  }
  try {
    const client = await applicationsApi.getOidcModelById(req.body.clientId, req);

    if (client && client.redirect_uris.indexOf(req.body.redirectUri !== -1)) {
      res.redirect(`${req.body.redirectUri}?error=sessionexpired`);
    }
  } catch (e) {
    throw e;
  }
};

module.exports = postCompleteInteraction;
