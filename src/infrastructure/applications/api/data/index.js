const { omitBy, isNull, isUndefined } = require('lodash');

const booleanParams = ['digipassRequired', 'supportsUsernameLogin', 'requiresGiasLockoutCheck', 'explicitConsent'];

const mapEntity = async (entity) => {
  if (!entity) {
    return undefined;
  }

  const params = {};
  if (entity.relyingParty.params) {
    Object.keys(entity.relyingParty.params).forEach((key) => {
      let value = entity.relyingParty.params[key];
      if (booleanParams.find(x => x === key)) {
        value = value === '1' || value.toLowerCase() === 'true';
      }
      params[key] = value;
    });
  }

  let response = {
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

  response = omitBy(response, isNull);
  response = omitBy(response, isUndefined);
  return response;
};


module.exports = {
  mapEntity,
};
