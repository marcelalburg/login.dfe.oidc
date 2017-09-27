'use strict';

module.exports = {
  loggerSettings: {
    levels: {
      info: 0,
      ok: 1,
      error: 2,
    },
    colors: {
      info: 'yellow',
      ok: 'green',
      error: 'red',
    },
  },
  requestVerification: {
    isEnabled:
      (process.env.REQUEST_VERIFICATION_ENABLED === undefined
        || process.env.REQUEST_VERIFICATION_ENABLED === null)
        ? false
        : process.env.REQUEST_VERIFICATION_ENABLED.toLowerCase() === 'true',
  },
  hostingEnvironment: {
    env: process.env.NODE_ENV ? process.env.NODE_ENV : 'dev',
    host: process.env.HOST ? process.env.HOST : 'localhost',
    port: process.env.PORT ? process.env.PORT : 4431,
    protocol: (process.env.NODE_ENV ? process.env.NODE_ENV : 'dev') === 'dev' ? 'https' : 'http',
  },
};
