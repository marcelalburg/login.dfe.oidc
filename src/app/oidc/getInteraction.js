const oidc = require('./oidcServer');
const config = require('./../../infrastructure/Config');
const logger = require('./../../infrastructure/logger');

const getInteraction = async (req, res) => {
  const details = await oidc.interactionDetails(req);
  logger.info('see what else is available to you for interaction views', details);

  res.redirect(`${config.oidc.interactionBaseUrl}/${details.uuid}/usernamepassword?clientid=${details.params.client_id}&redirect_uri=${details.params.redirect_uri}`);
};

module.exports = getInteraction;
