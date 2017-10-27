/* eslint-disable */
'use strict';
const Redis = require('ioredis');
const epochTime = require('../helpers/epoch_time');


function grantKeyFor(id) {
  return `grant:${id}`;
}

const get = (key) => {
  return new Promise((resolve, reject) => {
    const redisClient = new Redis('redis://127.0.0.1:6379'); //TODO: Get connection string
    try {
      redisClient.get(key).then((result) => {
        resolve(result);
      });
    } catch (e) {
      redisClient.disconnect();
      reject(e);
    }
  });
};
const set = (key, value) => {
  return new Promise((resolve, reject) => {
    const redisClient = new Redis('redis://127.0.0.1:6379'); //TODO: Get connection string
    try {
      redisClient.set(key, value).then(() => {
        resolve();
      });
    } catch (e) {
      redisClient.disconnect();
      reject(e);
    }
  });
};
const del = (key) => {
  return new Promise((resolve, reject) => {
    const redisClient = new Redis('redis://127.0.0.1:6379'); //TODO: Get connection string
    try {
      redisClient.det(key, value).then(() => {
        resolve();
      });
    } catch (e) {
      redisClient.disconnect();
      reject(e);
    }
  });
};


class RedisAdapter {

  constructor(name) {
    this.name = name;
  }

  key(id) {
    return `${this.name}:${id}`;
  }

  async destroy(id) {
    const key = this.key(id);
    const x = await get(key);
    const grantId = x && x.grantId;

    await del(key);

    if (grantId) {
      const grantKey = grantKeyFor(grantId);
      const grant = await get(grantKey);
      for (let i = 0; i < grant.length; i++) {
        del(grant(i));
      }
    }
  }

  async consume(id) {
    const key = this.key(id);
    const item = await get(key);
    item.consumed = epochTime();
    await set(key, item);
  }

  find(id) {
    return get(this.key(id));
  }

  async upsert(id, payload, expiresIn) {
    const key = this.key(id);

    const { grantId } = payload;
    if (grantId) {
      const grantKey = grantKeyFor(grantId);
      const grant = await get(grantKey);
      if (grant) {
        grant.push(key);
      }
      set(grantKey, [key]);
    }

    await set(key, payload); //, expiresIn * 1000);
  }

  static connect(provider) { // eslint-disable-line no-unused-vars
    // noop
  }
}

module.exports = RedisAdapter;
