'use strict';

const crypto = require('crypto');

const cryptoVerify = crypto.createVerify('RSA-SHA256');

class DigitalSignatureService {
  static write(contents) {
    cryptoVerify.write(contents);
    cryptoVerify.end();
  }
  static verifySignature(publicKey, sig) {
    cryptoVerify.verify(publicKey, sig, 'base64');
  }
}

module.exports = DigitalSignatureService;
