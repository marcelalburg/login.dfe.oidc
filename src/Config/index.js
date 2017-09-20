'use strict';

module.exports = {
  requestVerification: {
    isEnabled:
      (process.env.REQUEST_VERIFICATION_ENABLED === undefined
        || process.env.REQUEST_VERIFICATION_ENABLED === null)
        ? false
        : process.env.REQUEST_VERIFICATION_ENABLED,
  },
  hostingEnvironment: {
    env: process.env.NODE_ENV ? process.env.NODE_ENV : 'dev',
    host: process.env.HOST ? process.env.HOST : 'localhost',
    port: process.env.PORT ? process.env.PORT : 4431,
    protocol: (process.env.NODE_ENV ? process.env.NODE_ENV : 'dev') === 'dev' ? 'https' : 'http',
  },
};
