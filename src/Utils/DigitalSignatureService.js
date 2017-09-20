'use strict';

const crypto = require('crypto');

class DigitalSignatureService {

  verifyRequest(contents, publicKey, sig) {
    const cryptoVerify = crypto.createVerify('RSA-SHA256');
    cryptoVerify.write(contents);
    cryptoVerify.end();
    return cryptoVerify.verify(publicKey, sig, 'base64');
  }
}

module.exports = DigitalSignatureService;
