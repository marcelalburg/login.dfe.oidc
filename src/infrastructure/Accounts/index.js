'use strict';

const request = require('request-promise');
const config = require('./../Config');
const jwtStrategy = require('login.dfe.jwt-strategies');
const uuid = require('uuid/v4');
const logger = require('./../logger');

class Account {
  constructor(user) {
    this.accountId = user.sub;
    this.user = user;
  }
  claims() {
    return {
      sub: this.accountId,
      name: this.user.name,
      given_name: this.user.given_name,
      family_name: this.user.family_name,
      middle_name: this.user.middle_name,
      nickname: this.user.nickname,
      email: this.user.email,
    };
  }

  static async findById(ctx, id) {
    try {
      const bearerToken = await jwtStrategy(config.accounts).getBearerToken();
      const userDirectoriesUrl = `${config.accounts.url}users/${id}`;
      let correlationId = uuid();

      if (ctx && ctx.req && ctx.req.id) {
        correlationId = ctx.req.id;
      }

      logger.info(`calling directories api with: ${userDirectoriesUrl}`);

      const response = await request.get(userDirectoriesUrl, {
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
          logger.warn(`user not found Id:${id}`);
          return null;
        }
        const user = JSON.parse(response.body);
        logger.info(`user returned : ${user}`);
        returnValue = user === undefined ? null : user;
        return new Account(returnValue);
      }
      return null;
    } catch (e) {
      logger.warn(`user not found Id:${id} error: ${e}`);
      return null;
    }
  }
}

module.exports = Account;
