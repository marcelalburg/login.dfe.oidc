'use strict';

const HotConfigAdapter = require('./HotConfigAdapter');
const request = require('request');

class HotConfigApiAdapter extends HotConfigAdapter {
  async find(id) {
    let returnValue = null;
    request.get(process.env.CLIENTS_URL, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        if (!body) {
          return null;
        }
        const clients = JSON.parse(body);
        const client = clients.find(item => item.client_id === id);

        returnValue = client === undefined ? null : client;
      } else {
        returnValue = null;
      }
    });
    return returnValue;
  }
}

module.exports = HotConfigApiAdapter;
