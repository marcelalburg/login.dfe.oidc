const oidc = require('./oidcServer');

const getConfirmInteraction = async (req, res) => {
  await oidc.interactionFinished(req, res, {
    consent: {},
  });
};

module.exports = getConfirmInteraction;