'use strict'

const fs = require('fs');
const config = require('./../Config');
const DigitalSignatureService = require('./../Utils/DigitalSignatureService');

class RequestVerification {
  static verifyRequest(req) {
    if (!config.requestVerification.isEnabled) {
      return true;
    }

    const publicKey = fs.readFileSync('./ssl/interactions.cert', 'utf8');

    const userId = req.body.uid;
    const sig = req.body.sig;

    DigitalSignatureService.write(JSON.stringify({ uuid: req.params.grant, uid: userId }));

    const verified = DigitalSignatureService.verifySignature(publicKey, sig);
    return verified;
  }
}
module.exports = RequestVerification;