/* eslint-disable */
'use strict';

class HotConfigAdapter {


  constructor(name) {
    this.name = name;
  }


  async upsert(id, payload, expiresIn) {
    return Promise.resolve({});
  }

  async find(id) {
    return Promise.resolve({client_id: 'foo', client_secret: 'bar', redirect_uris: ['http://lvh.me/cb']});
  }


  async consume(id) {
    return Promise.resolve({});
  }


  async destroy(id) {
    return Promise.resolve({});
  }


  static async connect(provider) {
  }
}

module.exports = HotConfigAdapter;
