const secretStrategy = require('./secret');
const aadStrategy = require('./aad');

const getJwtStrategy = (config) => {
  const requiresJwt = config.url !== undefined;
  if (!requiresJwt) {
    return null;
  }

  if (config.auth.type === 'secret') {
    return secretStrategy(config);
  }

  if (config.auth.type === 'aad') {
    return aadStrategy(config);
  }
};

module.exports = getJwtStrategy;

