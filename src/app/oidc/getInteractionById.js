const oidc = require('./oidcServer');

const getSession = async (id) => {
  try {
    return await oidc.Session.find(id);
  } catch (e) {
    throw new Error(`Error getting session with id ${id} - ${e.message}`);
  }
};

const getInteractionDetails = (session) => {
  const details = {
    client_id: session.params.client_id,
    redirect_uri: session.params.redirect_uri,
  };
  Object.keys(session.interaction).forEach((key) => {
    if (['error', 'error_description', 'reason'].find(x => x === key)) {
      return;
    }
    details[key] = session.interaction[key];
  });
  if (session.interaction.error === 'consent_required') {
    details.scopes = session.params.scope.split(/\s/gi);
    details.uid = session.accountId;
  }
  return details;
};

const getInteractionById = async (req, res) => {
  const session = await getSession(req.params.grant);
  if (!session || !session.uuid) {
    return res.status(404).send();
  }

  const details = getInteractionDetails(session);

  return res.json(details);
};

module.exports = getInteractionById;
