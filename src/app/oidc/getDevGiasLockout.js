const config = require('./../../infrastructure/Config');
const KeepAliveAgent = require('agentkeepalive').HttpsAgent;
const rp = require('request-promise').defaults({
  agent: new KeepAliveAgent({
    maxSockets: config.hostingEnvironment.agentKeepAlive.maxSockets,
    maxFreeSockets: config.hostingEnvironment.agentKeepAlive.maxFreeSockets,
    timeout: config.hostingEnvironment.agentKeepAlive.timeout,
    keepAliveTimeout: config.hostingEnvironment.agentKeepAlive.keepAliveTimeout,
  }),
});

const getDevGiasLockout = async (req, res) => {
  let model = {
    uuid: req.params.uuid,
    oid: '',
    details: {},
    error: '',
  };
  try {
    const he = config.hostingEnvironment;
    model.details = await rp({
      method: 'GET',
      uri: `${he.protocol}://${he.host}:${he.port}/interaction/${req.params.uuid}/check`,
      json: true,
    });
    model.oid = model.details.oid;
    model.uid = model.details.uid;
  } catch (e) {
    model.error = e.stack;
  }
  res.render('oidc/views/gias-lockout', model);
};

module.exports = getDevGiasLockout;
