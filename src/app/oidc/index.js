'use strict';

const RequestVerification = require('login.dfe.request-verification');
const bodyParser = require('body-parser');
const config = require('./../../infrastructure/Config/index');
const interactions = require('./../interactions/index');

const parse = bodyParser.urlencoded({extended: false});

const init = (app, oidc) => {
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
    res.render('oidc/views/usernamepassword', {uuid: req.params.uuid});
  });

  app.post('/interaction/:grant/complete', parse, (req, res) => {
    const contents = JSON.stringify({uuid: req.params.grant, uid: req.body.uid});

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
};

module.exports = init;
