'use strict';

// see previous example for the things that are not commented
const Provider = require('oidc-provider');
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const adapter = require('./adapters/MasterAdapter');
const RequestVerification = require('./RequestVerification/RequestVerification');

const app = express();


// TODO : Work out the URL based on the ENV...
const oidc = new Provider(`https://${process.env.HOST}:${process.env.PORT}`, {
  clientCacheDuration: 60,
  interactionUrl(ctx) {
    return `/interaction/${ctx.oidc.uuid}`;
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

// TODO : Work out a better way of managing Keys when not in Dev...
const keystore = require('./keystore.json');

oidc.initialize({

  keystore,
  adapter,
}).then(() =>  {
  app.proxy = true
  app.keys = process.env.SECURE_KEY.split(',');
}).then(() => {
  app.set('trust proxy', true);
  app.set('view engine', 'ejs');
  app.set('views', path.resolve(__dirname, 'views'));

  const port = process.env.PORT;
  const parse = bodyParser.urlencoded({ extended: false });

  const options = {
    key: (process.env.NODE_ENV === undefined || process.env.NODE_ENV === 'dev') ? fs.readFileSync('./ssl/localhost.key') : null,
    cert: (process.env.NODE_ENV === undefined || process.env.NODE_ENV === 'dev') ? fs.readFileSync('./ssl/localhost.cert') : null,
    requestCert: false,
    rejectUnauthorized: false,
  };

  if (process.env.NODE_ENV === undefined || process.env.NODE_ENV === 'dev') {
    const https = require('https');
    const server = https.createServer(options, app);

    server.listen(port, () => {
      console.log(`Dev server listening on https://${process.env.HOST}:${process.env.PORT}`);
    });
  } else {
    app.listen(port);
  }
  app.get('/interaction/:grant', async (req, res) => {
    oidc.interactionDetails(req).then((details) => {
      console.log('see what else is available to you for interaction views', details);

      const url = `${process.env.INTERACTION_BASE_URL}/${details.uuid}/usernamepassword`;
      res.redirect(url);
    });
  });


  app.post('/interaction/:grant/confirm', parse, (req, res) => {
    oidc.interactionFinished(req, res, {
      consent: {},
    });
  });

  app.get('/:uuid/usernamepassword', (req,res) => {
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
        console.log('then', details);
      }));
    } else {
      oidc.interactionFinished(req, res, {});
    }
  });

  app.use(oidc.callback);
}).catch((e) => {
  console.log(e);
},
);
