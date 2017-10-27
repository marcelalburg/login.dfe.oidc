/* eslint-disable */
'use strict';
const Redis = require('ioredis');
const epochTime = require('../helpers/epoch_time');
const config = require('./../Config');


function grantKeyFor(id) {
  return `grant:${id}`;
}

const get = (key) => {
  return new Promise((resolve, reject) => {
    const redisClient = new Redis(config.oidc.redisConnectionString);
    try {
      redisClient.get(key).then((result) => {
        resolve(JSON.parse(result));
      });
    } catch (e) {
      redisClient.disconnect();
      reject(e);
    }
  });
};
const set = (key, value) => {
  return new Promise((resolve, reject) => {
    const redisClient = new Redis(config.oidc.redisConnectionString);
    try {
      redisClient.set(key, JSON.stringify(value)).then(() => {
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
    const redisClient = new Redis(config.oidc.redisConnectionString);
    try {
      redisClient.del(key).then(() => {
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
    console.info(`destroy ${key}`);
    const x = await get(key);
    const grantId = x && x.grantId;

    await del(key);

    if (grantId) {
      const grantKey = grantKeyFor(grantId);
      const grant = await get(grantKey);
      for (let i = 0; i < grant.length; i++) {
        await del(grant(i));
      }
    }
  }

  async consume(id) {
    const key = this.key(id);
    console.info(`consume ${key}`);
    const item = await get(key);
    item.consumed = epochTime();
    await set(key, item);
  }

  async find(id) {
    const key = this.key(id);
    console.info(`find ${key}`);
    return await get(key);
  }

  async upsert(id, payload, expiresIn) {
    const key = this.key(id);
    console.info(`upsert ${key}`);

    const { grantId } = payload;
    if (grantId) {
      const grantKey = grantKeyFor(grantId);
      const grant = await get(grantKey);
      if (grant) {
        grant.push(key);
      }
      await set(grantKey, [key]);
    }

    await set(key, payload); //, expiresIn * 1000);
  }

  static connect(provider) { // eslint-disable-line no-unused-vars
    // noop
  }
}

module.exports = RedisAdapter;
