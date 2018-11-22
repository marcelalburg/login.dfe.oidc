'use strict';

const ApplicationsAdapter = require('./ApplicationsAdapter');
const api = require('./api');

const logger = require('./../logger');

class ApplicationsApiAdapter extends ApplicationsAdapter {
  async find(id, ctx) {
    if (id === 'internal.education.gov.uk') { // THIS WOULD BE A CONFIG ITEM
      return {
        client_id: 'internal.education.gov.uk', // THIS WOULD BE A CONFIG ITEM
        client_secret: 'pricepricepricepricepricepriceprice', // THIS WOULD BE A CONFIG ITEM
        id_token_signed_response_alg: 'HS256',
        redirect_uris: ['https://signin.education.gov.uk'],
        grant_types: ['client_credentials'],
        response_types: ['none'],
        token_endpoint_auth_method: 'client_secret_post',
      };
    }
    logger.info('calling applications for clientId: ', id);
    try {
      const client = await api.getOidcModelById(id);
      if (client) {
        return client;
      }
      logger.info('calling applications for clientId: ', id, ' returned null');
      return null;
    } catch (e) {
      logger.error('Error calling applications for clientId: ', id, ' ERROR', e);
    }
  }
}

module.exports = ApplicationsApiAdapter;
