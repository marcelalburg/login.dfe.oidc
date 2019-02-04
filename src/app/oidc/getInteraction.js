const oidc = require('./oidcServer');
const config = require('./../../infrastructure/Config');
const logger = require('./../../infrastructure/logger');
const applicationsApi = require('./../../infrastructure/applications/api');

const getInteraction = async (req, res) => {
  try {
    const details = await oidc.interactionDetails(req);
    logger.info('see what else is available to you for interaction views', details);

    if (details.interaction.type === 'digipass') {
      return res.redirect(`${config.oidc.interactionBaseUrl}/${details.uuid}/digipass?uid=${details.interaction.uid}&redirect_uri=${details.params.redirect_uri}`);
    }
    if (details.interaction.type === 'sms') {
      return res.redirect(`${config.oidc.interactionBaseUrl}/${details.uuid}/sms?clientid=${details.params.client_id}&uid=${details.interaction.uid}&redirect_uri=${details.params.redirect_uri}`);
    }
    if (details.interaction.type === 'select-organisation') {
      return res.redirect(`${config.oidc.interactionBaseUrl}/${details.uuid}/select-organisation?uid=${details.interaction.uid}&redirect_uri=${details.params.redirect_uri}`);
    }
    if (details.interaction.type === 'gias-lockout-check') {
      return res.redirect(`${config.oidc.interactionBaseUrl}/${details.uuid}/gias-lockout?redirect_uri=${details.params.redirect_uri}`);
    }
    if (details.interaction.error === 'consent_required') {
      return await oidc.interactionFinished(req, res, {
        login: {
          account: details.accountId,
        },
        consent: {},
      });
    }

    return res.redirect(`${config.oidc.interactionBaseUrl}/${details.uuid}/usernamepassword?clientid=${details.params.client_id}&redirect_uri=${details.params.redirect_uri}`);
  } catch (e) {
    logger.warn(`Unable to get interaction details - falling back to redirect uri - error ${e.message}`);
  }
  try {
    const client = await applicationsApi.getOidcModelById(req.params.clientId, req);

    if (client && client.redirect_uris.indexOf(req.params.redirect_uri)) {
      return res.redirect(`${req.params.redirect_uri}?error=sessionexpired`);
    }
  } catch (e) {
    throw e;
  }
};

module.exports = getInteraction;
