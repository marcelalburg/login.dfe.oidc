const logger = require('./../../infrastructure/logger');

const authorizationSuccess = (ctx) => {
  logger.audit(`Authenticated ${ctx.oidc.account.user.email} (id: ${ctx.oidc.account.user.sub}) for ${ctx.oidc.client.clientId}`, {
    type: 'sign-in',
    success: true,
    userId: ctx.oidc.account.user.sub,
    userEmail: ctx.oidc.account.user.email,
    client: ctx.oidc.client.clientId,
  });
};


const attachEventListeners = (oidcProvider) => {
  oidcProvider.on('authorization.success', authorizationSuccess);
};

module.exports = {
  attachEventListeners,
};
