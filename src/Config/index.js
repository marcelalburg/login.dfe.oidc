'use strict';

const renderConfig = () => {
  const isDev = (process.env.NODE_ENV ? process.env.NODE_ENV : 'dev') === 'dev';

  return {
    requestVerification: {
      isEnabled:
        (process.env.REQUEST_VERIFICATION_ENABLED === undefined
          || process.env.REQUEST_VERIFICATION_ENABLED === null)
          ? false
          : process.env.REQUEST_VERIFICATION_ENABLED.toLowerCase() === 'true',
    },
    hotConfig: {
      url: process.env.CLIENTS_URL,
      async getBearerToken() {
        return process.env.CLIENTS_TOKEN;
      },
    },
    hostingEnvironment: {
      env: process.env.NODE_ENV ? process.env.NODE_ENV : 'dev',
      host: process.env.HOST ? process.env.HOST : 'localhost',
      port: process.env.PORT ? process.env.PORT : 4431,
      protocol: isDev ? 'https' : 'http',
    },
  };
};


module.exports = renderConfig();
