const expect = require('chai').expect;
const sinon = require('sinon');
const fs = require('fs');
// const config = require('../../src/Config');
const proxyquire = require('proxyquire');
const DigitalSignatureService = require('../../src/Utils/DigitalSignatureService');

const expectedUid = 'myuid';
const expectedUuid = 'myUuid';
const expectedSig = 'YWJjZGVm';

const req = {
  body: {
    uid: expectedUid,
    sig: expectedSig,
  },
  params: {
    grant: expectedUuid,
  },
};

const config = {
  requestVerification: {
    isEnabled: false,
    cert: 'abcdefg',
  },
};

const RequestVerification = proxyquire('../../src/RequestVerification/RequestVerification', {
  './../Config': config,
});

describe('When verifying the request', () => {
  let sandbox;
  let requestVerification;

  beforeEach(() => {
    requestVerification = new RequestVerification();
    sandbox = sinon.sandbox.create();
    sandbox.stub(config.requestVerification, 'isEnabled').get(() => true);
  });
  afterEach(() => {
    sandbox.restore();
  });
  it('the interactions certification is loaded', () => {
    sandbox.stub(DigitalSignatureService.prototype, 'verifyRequest').returns(true);


    requestVerification.verifyRequest(req);


  });
  it('the verify function is called passing in the signature and public key and contents', () => {
    const expectedCertContent = 'abcdefg';
    sandbox.stub(DigitalSignatureService.prototype, 'verifyRequest').withArgs(`{"uuid":"${expectedUuid}","uid":"${expectedUid}"}`, expectedCertContent, expectedSig).returns(true);

    const actual = requestVerification.verifyRequest(req);

    expect(actual).to.equal(true);
  });
  it('true is returned if config to not verify requests is set', () => {
    sandbox.stub(config.requestVerification, 'isEnabled').get(() => false);
    const mock = sinon.mock(fs);

    mock.expects('readFileSync').never();
    const actual = requestVerification.verifyRequest(req);

    expect(actual).to.equal(true);
    mock.verify();
  });
});
