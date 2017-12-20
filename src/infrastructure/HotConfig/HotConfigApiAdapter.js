'use strict';

const HotConfigAdapter = require('./HotConfigAdapter');
const request = require('request-promise');
const config = require('./../Config');
const jwtStrategy = require('login.dfe.jwt-strategies');
const uuid = require('uuid/v4');

class HotConfigApiAdapter extends HotConfigAdapter {
  async find(id, ctx) {
    const bearerToken = await jwtStrategy(config.hotConfig).getBearerToken();
    let correlationId = uuid();
    if (ctx && ctx.req && ctx.req.id) {
      correlationId = ctx.req.id;
    }

    try {
      const response = await request.get(config.hotConfig.url, {
        auth: { bearer: bearerToken },
        strictSSL: false,
        resolveWithFullResponse: true,
        headers: {
          'x-correlation-id': correlationId,
        },
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
