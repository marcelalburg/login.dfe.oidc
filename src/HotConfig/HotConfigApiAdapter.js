'use strict';

const HotConfigAdapter = require('./HotConfigAdapter');
const request = require('request-promise');


class HotConfigApiAdapter extends HotConfigAdapter {
  async find(id) {
    return new Promise((resolve, reject) => {
      request.get(process.env.CLIENTS_URL,
        { auth: { bearer: process.env.CLIENTS_TOKEN } }, (error, response, body) => {
          let returnValue = null;
          if (!error && response.statusCode === 200) {
            if (!body) {
              resolve(null);
            }
            const clients = JSON.parse(body);
            const client = clients.find(item => item.client_id === id);

            returnValue = client === undefined ? null : client;
            resolve(returnValue);
          } else {
            returnValue = null;
            reject(response);
          }
        }); // .auth(null, null, true, process.env.CLIENTS_TOKEN)
    });
  }
}

module.exports = HotConfigApiAdapter;
