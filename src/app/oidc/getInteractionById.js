const oidc = require('./oidcServer');

const getSession = async (id) => {
  try {
    return await oidc.Session.find(id);
  } catch (e) {
    throw new Error(`Error getting session with id ${id} - ${e.message}`);
  }
};

const getInteractionById = async (req, res) => {
  const session = await getSession(req.params.grant);
  if (!session || !session.uuid) {
    return res.status(404).send();
  }

  return res.json({
    client_id: session.params.client_id,
    redirect_uri: session.params.redirect_uri,
  });
};

module.exports = getInteractionById;
