/* eslint-disable */
'use strict';

class ApplicationsAdapter {

  constructor(name) {
    this.name = name;
  }


  async upsert(id, payload, expiresIn) {
    return Promise.resolve({});
  }

  async find(id, ctx) {
    return Promise.resolve({});
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

module.exports = ApplicationsAdapter;
