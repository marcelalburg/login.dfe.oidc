'use strict';

// see previous example for the things that are not commented

const assert = require('assert');
const Provider = require('oidc-provider');

const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

const adapter = require('./adapters/MasterAdapter');


// TODO : Work out the URL based on the ENV...
const oidc = new Provider(`https://${process.env.HOST}:${process.env.PORT}`, {
  clientCacheDuration: 60,
  features: {
    claimsParameter: true,
    discovery: true,
    encryption: true,
    introspection: true,
    registration: true,
    request: true,
    revocation: true,
    sessionManagement: true,
  },
});

// TODO : Work out a better way of managing Keys when not in Dev...
const keystore = require('./keystore.json');

oidc.initialize({

  keystore,
  adapter,
}).then(() => {
  app.proxy = true;
  app.keys = process.env.SECURE_KEY.split(',');
  app.use(oidc.callback);

  const port = process.env.PORT;

  console.log('NODE_ENV: ',process.env.NODE_ENV);

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

  app.get('/interaction/:grant', async (ctx, next) => {
    oidc.interactionDetails(next).then((details) => {
      console.log('see what else is available to you for interaction views', details);

      // TODO To come from config
      const url = `https://floating-temple-42985.herokuapp.com/usernamepassword?uuid=${details.uuid}`;
      next.redirect(url);
    });
  });

  const body = bodyParser();

  app.post('/interaction/:grant/confirm', body, async (ctx, next) => {
    const result = { consent: {} };
    await oidc.interactionFinished(ctx.req, ctx.res, result);
    await next();
  });

  app.post('/interaction/:grant/login', body, async (ctx, next) => {
    const account = await Account.findByLogin(ctx.request.body.login);

    const result = {
      login: {
        account: account.accountId,
        acr: 'urn:mace:incommon:iap:bronze',
        amr: ['pwd'],
        remember: !!ctx.request.body.remember,
        ts: Math.floor(Date.now() / 1000),
      },
      consent: {},
    };

    await oidc.interactionFinished(ctx.req, ctx.res, result);
    await next();
  });

}).catch((e) => {
  console.log(e);
},
);
