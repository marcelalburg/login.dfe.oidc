/* eslint-disable no-underscore-dangle */
const uuid = require('uuid/v4');
const config = require('./../../infrastructure/Config');
const applicationsApi = require('./../../infrastructure/applications/api');
const logger = require('./../../infrastructure/logger');
const Provider = require('oidc-provider');
const Account = require('./../../infrastructure/Accounts');
const logoutAction = require('./../logout');
const errorAction = require('./../error');
const { attachEventListeners } = require('./eventListeners');


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

const interactionsToRunEveryTime = ['select-organisation', 'gias-lockout-check', 'consent'];

const oidc = new Provider(`${config.hostingEnvironment.protocol}://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}`, {
  clientCacheDuration: 300,
  logoutSource: logoutAction,
  renderError: errorAction,
  findById: async (ctx, id, token) => {
    if (token) {
      return Account.findById(ctx, id, token.claims);
    }

    const meta = ctx.oidc.session.metaFor(ctx.oidc.params.client_id);
    if (meta) {
      return Account.findById(ctx, id, meta);
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
    keys: config.oidc.secureKey.split(','),
  },
  claims: {
    // scope: [claims] format
    openid: ['sub'],
    email: ['email'],
    profile: ['given_name', 'family_name'],
    // organisation: { organisation: null },
    organisation: ['organisation', 'organisationIds'],
  },
  interactionUrl(ctx) {
    return `/interaction/${ctx.oidc.uuid}`;
  },
  async interactionCheck(ctx) {
    const client = await applicationsApi.getOidcModelById(ctx.oidc.client.clientId);

    logger.debug('checking interaction');
    if (!ctx.oidc.session.interactionsCompleted) {
      ctx.oidc.session.interactionsCompleted = [];
    }
    if (!ctx.oidc.session.extraClaims) {
      ctx.oidc.session.extraClaims = {};
    }

    if (ctx.oidc.result && ctx.oidc.result.meta && ctx.oidc.result.meta.interactionCompleted) {
      logger.debug(`adding ${ctx.oidc.result.meta.interactionCompleted} to completed interactions`);
      ctx.oidc.session.interactionsCompleted.push(ctx.oidc.result.meta.interactionCompleted);

      if (ctx.oidc.result.meta.interactionCompleted === 'select-organisation') {
        ctx.oidc.session.extraClaims.organisation = ctx.oidc.result.meta.organisation;
      }
      if (ctx.oidc.result.meta.interactionCompleted === 'consent') {
        ctx.oidc.session.extraClaims.organisationIds = ctx.oidc.result.meta.organisationIds;
      }

      await ctx.oidc.session.save();
    }

    if (client.params.digipassRequired && !ctx.oidc.session.interactionsCompleted.find(x => x === 'digipass')) {
      logger.debug('No digipass completed. Time to do it.');
      ctx.oidc.result = undefined;
      ctx.oidc.ctx._matchedRouteName = 'authorization';
      return {
        error: 'login_required',
        reason: 'digipass_prompt',
        type: 'digipass',
        uid: ctx.oidc.account.user.sub,
      };
    }

    if (client.params.smsRequired && !ctx.oidc.session.interactionsCompleted.find(x => x === 'sms')) {
      logger.debug('No sms completed. Time to do it.');
      ctx.oidc.result = undefined;
      ctx.oidc.ctx._matchedRouteName = 'authorization';
      return {
        error: 'login_required',
        reason: 'sms_prompt',
        type: 'sms',
        uid: ctx.oidc.account.user.sub,
      };
    }

    if (ctx.oidc.params.prompt === 'consent' && client.params.explicitConsent && !ctx.oidc.session.interactionsCompleted.find(x => x === 'consent')) {
      logger.debug('No consent. Lets ask the user');
      ctx.oidc.result = undefined;
      ctx.oidc.ctx._matchedRouteName = 'authorization';
      return {
        error: 'consent_required',
        error_description: 'prompt consent was not resolved',
        reason: 'consent_prompt',
      };
    }

    if (!ctx.oidc.session.interactionsCompleted.find(x => x === 'consent')) {
      if (ctx.oidc.params.scope.includes('organisation') && !ctx.oidc.session.interactionsCompleted.find(x => x === 'select-organisation')) {
        logger.info('will need to pick which Org this person belongs too. Time to do it..');
        ctx.oidc.result = undefined;
        ctx.oidc.ctx._matchedRouteName = 'authorization';
        return {
          error: 'login_required',
          reason: 'select-organisation',
          type: 'select-organisation',
          uid: ctx.oidc.account.user.sub,
        };
      }

      if (client.params.requiresGiasLockoutCheck && !ctx.oidc.session.interactionsCompleted.find(x => x === 'gias-lockout-check')) {
        logger.info('No GIAS lockout check completed. Time to do it.');
        ctx.oidc.result = undefined;
        ctx.oidc.ctx._matchedRouteName = 'authorization';
        return {
          error: 'login_required',
          reason: 'gias_lockout_check_prompt',
          type: 'gias-lockout-check',
          uid: ctx.oidc.account.user.sub,
          oid: ctx.oidc.session.extraClaims.organisation.id,
        };
      }
    } else {
      logger.debug('Skipping organisation interactions as consent flow has been done');
    }

    logger.debug('completed all interactions');
    if (!ctx.oidc.session.sidFor(ctx.oidc.client.clientId)) {
      logger.debug(`adding ${ctx.oidc.client.clientId} to authorized clients`);
      const sid = uuid();
      ctx.oidc.session.sidFor(ctx.oidc.client.clientId, sid);
    }
    ctx.oidc.session.interactionsCompleted = ctx.oidc.session.interactionsCompleted.filter(x => !interactionsToRunEveryTime.find(y => y === x));
    // ctx.oidc.session.interactionsCompleted = ctx.oidc.session.interactionsCompleted.filter(x => x !== 'select-organisation' && x !== 'gias-lockout-check');
    await ctx.oidc.session.save();

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
