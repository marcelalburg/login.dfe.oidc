'use strict';


const isDev = (process.env.NODE_ENV ? process.env.NODE_ENV : 'dev') === 'dev';

const hotConfigAuthTypes = [
  {
    type: 'secret',
    jwt: process.env.CLIENTS_TOKEN,
  },
  {
    type: 'aad',
    tenant: process.env.CLIENTS_AAD_TENANT,
    authorityHostUrl: process.env.CLIENTS_AAD_AUTHORITY,
    clientId: process.env.CLIENTS_AAD_CLIENT_ID,
    clientSecret: process.env.CLIENTS_AAD_CLIENT_SECRET,
    resource: process.env.CLIENTS_AAD_RESOURCE,
  },
];

const getHotConfigAuthOptions = () => {
  const strategy = (process.env.CLIENTS_TOKEN !== undefined) ? 'secret' : 'aad';
  return hotConfigAuthTypes.find(a => a.type === strategy);
};


module.exports = {
  requestVerification: {
    isEnabled:
      (process.env.REQUEST_VERIFICATION_ENABLED === undefined
        || process.env.REQUEST_VERIFICATION_ENABLED === null)
        ? false
        : process.env.REQUEST_VERIFICATION_ENABLED.toLowerCase() === 'true',
  },
  hotConfig: {
    url: process.env.CLIENTS_URL,
    auth: getHotConfigAuthOptions(),

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
