'use strict';

const fs = require('fs');
const config = require('./../Config');
const DigitalSignatureService = require('./../Utils/DigitalSignatureService');

let digitalSignatureService;

class RequestVerification {
  constructor() {
    digitalSignatureService = new DigitalSignatureService();
  }

  verifyRequest(req) {
    if (!config.requestVerification.isEnabled) {
      return true;
    }

    const publicKey = fs.readFileSync('./ssl/interactions.cert', 'utf8');
    const userId = req.body.uid;
    const sig = req.body.sig;

    const contents = JSON.stringify({ uuid: req.params.grant, uid: userId });
    const verified = digitalSignatureService.verifyRequest(contents, publicKey, sig);
    return verified;
  }
}
module.exports = RequestVerification;