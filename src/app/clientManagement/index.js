'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const config = require('./../../infrastructure/Config');
const Redis = require('ioredis');

const init = (oidcProvider) => {
  if (!oidcProvider) {
    throw new Error('Must provider oidcProvider');
  }

  const router = express.Router();

  router.use(bodyParser.urlencoded({ extended: true }));
  router.use(session({
    secret: config.clientManagement.sessionKey,
    saveUninitialized: false,
    resave: true,
  }));

  const getClients = async () => new Promise((resolve, reject) => {
    const redisClient = new Redis(config.clientManagement.connectionString);
    try {
      redisClient.get('OIDCClients').then((result) => {
        if (result === null || result === undefined) {
          resolve(null);
        }
        const clients = JSON.parse(result);
        resolve(clients);
      });
    } catch (e) {
      redisClient.disconnect();
      reject(e);
    }
  });
  const saveClients = clients => new Promise((resolve, reject) => {
    const redisClient = new Redis(config.clientManagement.connectionString);
    try {
      redisClient.set('OIDCClients', JSON.stringify(clients)).then(() => {
        resolve();
      });
    } catch (e) {
      redisClient.disconnect();
      reject(e);
    }
  });
  const getClient = async (id) => {
    if (!id) {
      return null;
    }

    const clients = await getClients();
    return clients.find(item => item.client_id.toLowerCase() === id.toLowerCase());
  };
  const saveClient = async (client) => {
    const clients = await getClients();
    const existing = clients.find(item => item.client_id.toLowerCase() === client.client_id.toLowerCase());
    if (existing) {
      existing.redirect_uris = client.redirect_uris;
    } else {
      clients.push(client);
    }

    await saveClients(clients);
  };

  const canManageClient = (req, res, next) => {
    if (req.session.manageClientId) {
      next();
    } else {
      res.redirect('/manage-client/login');
    }
  };

  router.get('/', canManageClient, async (req, res) => {
    const client = await getClient(req.session.manageClientId);
    if (!client) {
      req.session.manageClientId = null;
      res.redirect('/manage-client/login');
      return;
    }

    const redirectUrls = client.redirect_uris.reduce((x, y) => `${x}\n${y}`);

    res.render('clientManagement/views/manage', {
      redirectUrls,
      message: '',
    });
  });
  router.post('/', async (req, res) => {
    const client = await getClient(req.session.manageClientId);
    if (!client) {
      req.session.manageClientId = null;
      res.redirect('/manage-client/login');
      return;
    }

    client.redirect_uris = req.body.redirectUrls.split('\n').filter(item => item && item.trim().length > 0).map(item => item.replace('\r', ''));
    await saveClient(client);

    oidcProvider.clearClientCache();

    const redirectUrls = client.redirect_uris.reduce((x, y) => `${x}\n${y}`);
    res.render('clientManagement/views/manage', {
      redirectUrls,
      message: 'Client updated',
    });
  });

  router.get('/login', (req, res) => {
    res.render('clientManagement/views/login', {
      message: '',
    });
  });
  router.post('/login', async (req, res) => {
    const clientId = req.body.clientId;
    const clientSecret = req.body.clientSecret;

    const client = await getClient(clientId);
    if (client && client.client_secret === clientSecret) {
      req.session.manageClientId = clientId;
      res.redirect('/manage-client');
    } else {
      res.render('clientManagement/views/login', {
        message: 'invalid client id / secret',
      });
    }
  });

  return router;
};

module.exports = init;
