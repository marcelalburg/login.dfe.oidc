'use strict';

const HotConfigAdapter = require('./HotConfigAdapter');
const file = require('fs');
const path = require('path');
const { promisify } = require('util');

class HotConfigFileAdapter extends HotConfigAdapter {
  async find(id) {
    const readFile = promisify(file.readFile);
    const clientsJson = await readFile(path.resolve('app_data/clients.json'), { encoding: 'utf8' });

    if (!clientsJson) {
      return null;
    }

    const clients = JSON.parse(clientsJson);

    const client = clients.find(item => item.client_id === id);
    return client === undefined ? null : client;
  }
}

module.exports = HotConfigFileAdapter;
