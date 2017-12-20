const uuid = require('uuid/v4');
const config = require('./../../infrastructure/Config');
const HotConfig = require('./../../infrastructure/HotConfig');
const logger = require('./../../infrastructure/logger');
const Provider = require('oidc-provider');
const Accounts = require('./../../infrastructure/Accounts');
const logoutAction = require('./../logout');
const errorAction = require('./../error');

const hotConfig = new HotConfig();

const oidc = new Provider(`${config.hostingEnvironment.protocol}://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}`, {
  clientCacheDuration: 60,
  logoutSource: logoutAction,
  renderError: errorAction,
  findById: Accounts.findById,
  claims: {
    // scope: [claims] format
    openid: ['sub'],
    email: ['email'],
    profile: ['email', 'given_name', 'family_name'],
  },
  interactionUrl(ctx) {
    return `/interaction/${ctx.oidc.uuid}`;
  },
  async interactionCheck(ctx) {
    const client = await hotConfig.find(ctx.oidc.client.clientId, ctx);

    logger.info('checking interaction');
    if (!ctx.oidc.session.interactionsCompleted) {
      ctx.oidc.session.interactionsCompleted = [];
    }

    if (ctx.oidc.result && ctx.oidc.result.meta && ctx.oidc.result.meta.interactionCompleted) {
      logger.info(`adding ${ctx.oidc.result.meta.interactionCompleted} to completed interactions`);
      ctx.oidc.session.interactionsCompleted.push(ctx.oidc.result.meta.interactionCompleted);
      await ctx.oidc.session.save();
    }

    if (client.params.digipassRequired && !ctx.oidc.session.interactionsCompleted.find(x => x === 'digipass')) {
      logger.info('No digipass completed. Time to do it.');
      ctx.oidc.result = undefined;
      return {
        error: 'login_required',
        reason: 'digipass_prompt',
        type: 'digipass',
        uid: ctx.oidc.account.user.sub,
      };
    }

    logger.info('completed all interactions');
    if (!ctx.oidc.session.sidFor(ctx.oidc.client.clientId)) {
      logger.info(`adding ${ctx.oidc.client.clientId} to authorized clients`);
      const sid = uuid();
      ctx.oidc.session.sidFor(ctx.oidc.client.clientId, sid);
      await ctx.oidc.session.save();
    }

    return false;
  },
  // TODO deployment configuration
  features: {
    // disable the packaged interactions
    devInteractions: false,
    claimsParameter: true,
    clientCredentials: true,
    discovery: true,
    encryption: true,
    introspection: true,
    registration: true,
    request: true,
    requestUri: true,
    revocation: true,
    rejectUnauthorized: false,
    sessionManagement: true,
  },
});

module.exports = oidc;
