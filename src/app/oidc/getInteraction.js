const oidc = require('./oidcServer');
const config = require('./../../infrastructure/Config');
const logger = require('./../../infrastructure/logger');
const HotConfig = require('./../../infrastructure/HotConfig');

const hotConfig = new HotConfig();

const getInteraction = async (req, res) => {
  try {
    const details = await oidc.interactionDetails(req);
    logger.info('see what else is available to you for interaction views', details);

    if (details.interaction.type === 'digipass') {
      return res.redirect(`${config.oidc.interactionBaseUrl}/${details.uuid}/digipass?uid=${details.interaction.uid}`);
    }
    if (details.interaction.type === 'select_organisation') {
      return res.redirect(`${config.oidc.interactionBaseUrl}/${details.uuid}/choose-organisation?uid=${details.interaction.uid}`);
    }

    return res.redirect(`${config.oidc.interactionBaseUrl}/${details.uuid}/usernamepassword?clientid=${details.params.client_id}&redirect_uri=${details.params.redirect_uri}`);
  } catch (e) {
    logger.warn(`Unable to get interaction details - falling back to redirect uri - error ${e.message}`);
  }
  try {
    const client = await hotConfig.find(req.params.clientId, req);

    if (client && client.redirect_uris.indexOf(req.params.redirect_uri)) {
      return res.redirect(`${req.params.redirect_uri}/?error=sessionexpired`);
    }
  } catch (e) {
    throw e;
  }
};

module.exports = getInteraction;
