const path = require('path');
const uuid = require('uuid/v4');
const bodyParser = require('body-parser');
const config = require('./../../infrastructure/Config');
const logger = require('./../../infrastructure/logger');
const Provider = require('oidc-provider');
const RequestVerification = require('login.dfe.request-verification');
const adapter = require('./../../infrastructure/adapters/MasterAdapter');
const Accounts = require('./../../infrastructure/Accounts');
const logoutAction = require('./../logout');
const interactions = require('./../interactions');

const oidc = new Provider(`${config.hostingEnvironment.protocol}://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}`, {
  clientCacheDuration: 60,
  logoutSource: logoutAction,
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
    if (!ctx.oidc.session.sidFor(ctx.oidc.client.clientId)) {
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

const initialize = (app) => {
  const keystore = config.oidc.keyStore;

  return oidc.initialize({
    keystore,
    adapter,
  }).then(() => {
    app.proxy = true;
    app.keys = config.oidc.secureKey.split(',');
  }).then(() => {
    const parse = bodyParser.urlencoded({ extended: false });


    app.get('/interaction/:grant', async (req, res) => {
      oidc.interactionDetails(req).then((details) => {
        app.get('logger').info('see what else is available to you for interaction views', details);

        const url = `${config.oidc.interactionBaseUrl}/${details.uuid}/usernamepassword?clientid=${details.params.client_id}`;
        res.redirect(url);
      });
    });


    app.post('/interaction/:grant/confirm', parse, (req, res) => {
      oidc.interactionFinished(req, res, {
        consent: {},
      });
    });

    app.get('/:uuid/usernamepassword', (req, res) => {
      res.render('oidc/views/usernamepassword', { uuid: req.params.uuid });
    });

    app.post('/interaction/:grant/complete', parse, (req, res) => {
      const contents = JSON.stringify({ uuid: req.params.grant, uid: req.body.uid });

      if (config.requestVerification.isEnabled) {
        const requestVerification = new RequestVerification();
        const verified = requestVerification.verifyRequest(
          contents, config.requestVerification.cert, req.body.sig);
        if (!verified) {
          oidc.interactionFinished(req, res, {});
          return;
        }
      }

      if (req.body.status === 'failed') {
        interactions.render(res, 'loginerror', { reason: req.body.reason });
        return;
      }

      oidc.interactionFinished(req, res, {
        login: {
          account: req.body.uid, // becomes token
          acr: '1',
          // remember: !!req.body.remember,
          ts: Math.floor(Date.now() / 1000),
        },
        consent: {
          // TODO: remove offline_access from scopes if remember is not checked
        },
      }).then(((details) => {
        app.get('logger').info('then', details);
      }));
    });

    app.use(oidc.callback);
  });
};

const clearClientCache = () => {
  oidc.Client.cacheClear();
};

module.exports = {
  initialize,
  clearClientCache,
};
