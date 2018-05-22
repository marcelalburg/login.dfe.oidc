'use strict';
const config = require('./../Config');
const KeepAliveAgent = require('agentkeepalive').HttpsAgent;

const request = require('request-promise').defaults({
  agent: new KeepAliveAgent({
    maxSockets: config.hostingEnvironment.agentKeepAlive.maxSockets,
    maxFreeSockets: config.hostingEnvironment.agentKeepAlive.maxFreeSockets,
    timeout: config.hostingEnvironment.agentKeepAlive.timeout,
    keepAliveTimeout: config.hostingEnvironment.agentKeepAlive.keepAliveTimeout,
  }),
});

const jwtStrategy = require('login.dfe.jwt-strategies');
const uuid = require('uuid/v4');
const logger = require('./../logger');

class Account {
  constructor(user, claims) {
    this.accountId = user.sub;
    this.user = user;
    this.extraClaims = claims;
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
      ...(this.extraClaims),
    };
  }

  static async findById(ctx, id, claims = {}) {
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
        if (claims) {
          return new Account(returnValue, claims);
        }
        return new Account(returnValue);
      }
      return null;
    } catch (e) {
      if (e.statusCode === 404) {
        logger.warn(`user not found Id:${id} error: ${e}`);
        return null;
      }

      logger.error(`Error calling directories API ${e.message}`);

      throw e;
    }
  }
}

module.exports = Account;
