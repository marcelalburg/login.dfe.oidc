'use strict';

const RequestVerification = require('./../RequestVerification/RequestVerification');
const bodyParser = require('body-parser');

const parse = bodyParser.urlencoded({ extended: false });

const init = (app, oidc) => {
  app.get('/interaction/:grant', async (req, res) => {
    oidc.interactionDetails(req).then((details) => {
      app.logger.info('see what else is available to you for interaction views', details);

      const url = `${config.oidc.interactionBaseUrl}/${details.uuid}/usernamepassword`;
      res.redirect(url);
    });
  });


  app.post('/interaction/:grant/confirm', parse, (req, res) => {
    oidc.interactionFinished(req, res, {
      consent: {},
    });
  });

  app.get('/:uuid/usernamepassword', (req, res) => {
    res.render('usernamepassword', { uuid: req.params.uuid });
  });

  app.post('/interaction/:grant/complete', parse, (req, res) => {
    const requestVerification = new RequestVerification();
    const verified = requestVerification.verifyRequest(req);

    if (verified) {
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
        app.logger.info('then', details);
      }));
    } else {
      oidc.interactionFinished(req, res, {});
    }
  });

  app.use(oidc.callback);
};

module.exports = init;
