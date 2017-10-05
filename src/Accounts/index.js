'use strict';

const request = require('request-promise');
const config = require('../Config');
const jwtStrategy = require('login.dfe.jwt-strategies');
const HotConfigAdapter = require('../HotConfig');

class Account {
  constructor(id) {
    this.accountId = id;
  }
  claims() {
    return {
      sub: this.accountId,
      name: '',
      given_name: '',
      family_name: '',
      middle_name: '',
      nickname: '',
      email: '',
    };
  }

  static async findById(ctx, id) {
    try {
      const bearerToken = await jwtStrategy(config.accounts).getBearerToken();
      const hotConfig = new HotConfigAdapter();
      const client = await hotConfig.find(ctx.oidc.client.clientId);
      const response = await request.get(`${config.accounts.url}/${client.params.directoryId}/user/${id}`, {
        auth: { bearer: bearerToken },
        strictSSL: false,
        resolveWithFullResponse: true,
      });
      let returnValue = null;
      if (response.statusCode === 200) {
        if (!response.body) {
          return null;
        }
        const user = JSON.parse(response.body);

        returnValue = user === undefined ? null : user;
        return new Account(returnValue.id);
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}

module.exports = Account;
