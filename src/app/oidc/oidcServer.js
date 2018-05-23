const uuid = require('uuid/v4');
const config = require('./../../infrastructure/Config');
const HotConfig = require('./../../infrastructure/HotConfig');
const logger = require('./../../infrastructure/logger');
const Provider = require('oidc-provider');
const Account = require('./../../infrastructure/Accounts');
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
    if (token) {
      return Account.findById(ctx, id, token.claims);
    }

    return Account.withId(id);
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
    profile: ['given_name', 'family_name'],
    organisation: { organisation: null },
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
    if (!ctx.oidc.session.extraClaims) {
      ctx.oidc.session.extraClaims = {};
    }

    if (ctx.oidc.result && ctx.oidc.result.meta && ctx.oidc.result.meta.interactionCompleted) {
      logger.info(`adding ${ctx.oidc.result.meta.interactionCompleted} to completed interactions`);
      ctx.oidc.session.interactionsCompleted.push(ctx.oidc.result.meta.interactionCompleted);

      if (ctx.oidc.result.meta.interactionCompleted === 'select-organisation') {
        ctx.oidc.session.extraClaims.organisation = ctx.oidc.result.meta.organisation;
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

    if (ctx.oidc.params.scope.includes('organisation') && !ctx.oidc.session.interactionsCompleted.find(x => x === 'select-organisation')) {
      logger.info('will need to pick which Org this person belongs too. Time to do it..');
      ctx.oidc.result = undefined;
      return {
        error: 'login_required',
        reason: 'select-organisation',
        type: 'select-organisation',
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

    ctx.oidc.claims = ctx.oidc.session.extraClaims;
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
