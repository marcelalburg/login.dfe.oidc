'use strict';

const ApplicationsAdapter = require('./ApplicationsAdapter');
const api = require('./api');

const logger = require('./../logger');

class ApplicationsApiAdapter extends ApplicationsAdapter {
  async find(id, ctx) {
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
