'use strict';

const HotConfigAdapter = require('./HotConfigAdapter');
const request = require('request-promise');
const config = require('../Config');

class HotConfigApiAdapter extends HotConfigAdapter {
  async find(id) {
    const bearerToken = await config.hotConfig.getBearerToken();
    try {
      const response = await request.get(config.hotConfig.url, {
        auth: { bearer: bearerToken },
        strictSSL: false,
        resolveWithFullResponse: true,
      });
      let returnValue = null;
      if (response.statusCode === 200) {
        if (!response.body) {
          return null;
        }
        const clients = JSON.parse(response.body);
        const client = clients.find(item => item.client_id === id);

        returnValue = client === undefined ? null : client;
        return returnValue;
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}

module.exports = HotConfigApiAdapter;
