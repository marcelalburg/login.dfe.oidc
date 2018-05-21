const uuid = require('uuid/v4');
const config = require('./../../infrastructure/Config');
const HotConfig = require('./../../infrastructure/HotConfig');
const logger = require('./../../infrastructure/logger');
const Provider = require('oidc-provider');
const Accounts = require('./../../infrastructure/Accounts');
const logoutAction = require('./../logout');
const errorAction = require('./../error');
const { attachEventListeners } = require('./eventListeners');

const hotConfig = new HotConfig();

let shortCookieExpiryInMinutes = 30;
const shortCookieTimeOutInMinutes = parseInt(config.oidc.shortCookieTimeOutInMinutes);
if (!isNaN(shortCookieTimeOutInMinutes)) {
  shortCookieExpiryInMinutes = shortCookieTimeOutInMinutes;
}
const shortCookieExpiry = (60000 * shortCookieExpiryInMinutes);

let longCookieExpiryInMinutes = 60;
const longCookieTimeOutInMinutes = parseInt(config.oidc.longCookieTimeOutInMinutes);
if (!isNaN(shortCookieTimeOutInMinutes)) {
  longCookieExpiryInMinutes = longCookieTimeOutInMinutes;
}
const longCookieExpiry = (60000 * longCookieExpiryInMinutes);

const oidc = new Provider(`${config.hostingEnvironment.protocol}://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}`, {
  clientCacheDuration: 300,
  logoutSource: logoutAction,
  renderError: errorAction,
  findById: async (ctx, id, token) => {
    const claims = {};
    if (token) {
      claims.organisation_id = token.claims.orgId;
      return await Accounts.findById(ctx, id, claims);
    }

    return await Accounts.findById(ctx, id);
  },
  cookies: {
    long: {
      httpOnly: true, secure: true, maxAge: longCookieExpiry,
    },
    short: {
      httpOnly: true, secure: true, maxAge: shortCookieExpiry,
    },
  },
  claims: {
    // scope: [claims] format
    openid: ['sub'],
    email: ['email'],
    profile: ['email', 'given_name', 'family_name'],
    organisation: ['organisation_id', 'organisation_name', 'type', 'extra'],
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

      if (ctx.oidc.result.meta.interactionCompleted === 'select_organisation') {
        ctx.oidc.claims = { orgId: ctx.oidc.result.meta.orgId };
        ctx.oidc.session.orgId = ctx.oidc.result.meta.orgId;
      }

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

    if (ctx.oidc.params.scope.includes('organisation') && !ctx.oidc.session.interactionsCompleted.find(x => x === 'select_organisation')) {
      logger.info('will need to pick which Org this person belongs too. Time to do it..');
      ctx.oidc.result = undefined;
      return {
        error: 'login_required',
        reason: 'select_organisation',
        type: 'select_organisation',
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
    registration: false,
    request: true,
    requestUri: true,
    revocation: true,
    rejectUnauthorized: false,
    sessionManagement: true,
  },
});

attachEventListeners(oidc);

module.exports = oidc;
