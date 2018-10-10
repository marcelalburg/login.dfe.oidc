const { omit, isUndefined } = require('lodash');

const mapEntity = async (entity) => {
  if (!entity) {
    return undefined;
  }

  const params = {};
  if (entity.relyingParty.params) {
    Object.keys(entity.relyingParty.params).forEach((key) => {
      let value = entity.relyingParty.params[key];
      if (key === 'digipassRequired' || key === 'supportsUsernameLogin') {
        value = value === '1' || value.toLowerCase() === 'true';
      }
      params[key] = value;
    });
  }

  const response = {
    friendlyName: entity.name,
    client_id: entity.relyingParty.client_id,
    token_endpoint_auth_method: entity.relyingParty.token_endpoint_auth_method,
    client_secret: entity.relyingParty.client_secret,
    api_secret: entity.relyingParty.api_secret,
    response_types: entity.relyingParty.response_types,
    redirect_uris: entity.relyingParty.redirect_uris,
    grant_types: entity.relyingParty.grant_types,
    service_home: entity.relyingParty.service_home,
    post_logout_redirect_uris: entity.relyingParty.post_logout_redirect_uris,
    params,
    postResetUrl: entity.relyingParty.postResetUrl,
  };
  Object.keys(response).forEach(key => response[key] === undefined && delete response[key]);
  return response;
};


module.exports = {
  mapEntity,
};
