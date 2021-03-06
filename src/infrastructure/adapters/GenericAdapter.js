/* eslint-disable */
'use strict';
const LRU = require('lru-cache');
const epochTime = require('./../helpers/epoch_time');

const storage = new LRU({});

const grantKeyFor = (id) => {
  return `grant:${id}`;
}


class GenericAdapter {

  constructor(name) {
    this.name = name;
  }

  key(id) {
    return `${this.name}:${id}`;
  }

  destroy(id) {
    const key = this.key(id);
    const grantId = storage.get(key) && storage.get(key).grantId;

    storage.del(key);

    if (grantId) {
      const grantKey = grantKeyFor(grantId);

      storage.get(grantKey).forEach(token => storage.del(token));
    }

    return Promise.resolve();
  }

  consume(id) {
    storage.get(this.key(id)).consumed = epochTime();
    return Promise.resolve();
  }

  find(id) {
    return Promise.resolve(storage.get(this.key(id)));
  }

  upsert(id, payload, expiresIn) {
    const key = this.key(id);

    const { grantId } = payload;
    if (grantId) {
      const grantKey = grantKeyFor(grantId);
      const grant = storage.get(grantKey);
      if (!grant) {
        storage.set(grantKey, [key]);
      } else {
        grant.push(key);
      }
    }

    storage.set(key, payload, expiresIn * 1000);

    return Promise.resolve();
  }

  static connect(provider) { // eslint-disable-line no-unused-vars
    // noop
  }
}

module.exports = GenericAdapter;
