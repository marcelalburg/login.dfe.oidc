const expect = require('chai').expect;
const sinon = require('sinon');
const fs = require('fs');
const config = require('../../src/Config');
const RequestVerification = require('../../src/RequestVerification/RequestVerification');
const DigitalSignatureService = require('../../src/Utils/DigitalSignatureService');

const expectedUid = 'myuid';
const expectedUuid = 'myUuid';
const expectedSig = 'YWJjZGVm';

const req = { body: {
  uid: expectedUid,
  sig: expectedSig,
},
params: {
  grant: expectedUuid,
} };


describe('When verifying the request', () => {
  let sandbox;
  let requestVerification;

  beforeEach(() => {
    requestVerification = new RequestVerification();
    sandbox = sinon.sandbox.create();
    sandbox.stub(config.requestVerification,'isEnabled').get(() => {return true;});
  });
  afterEach(function(){
    sandbox.restore();
  });
  it('the interactions certification is loaded', () => {
    sandbox.stub(DigitalSignatureService.prototype,'verifyRequest').returns(true);
    const mock = sinon.mock(fs);
    mock.expects('readFileSync').once().withArgs('./ssl/interactions.cert', 'utf8').returns('abcdefg');

    requestVerification.verifyRequest(req);

    mock.verify();
  });
  it('the verify function is called passing in the signature and public key and contents', () => {
    const expectedCertContent = 'abcdefg';
    const mock = sinon.mock(fs);
    mock.expects('readFileSync').once().withArgs('./ssl/interactions.cert', 'utf8').returns(expectedCertContent);
    sandbox.stub(DigitalSignatureService.prototype,'verifyRequest').withArgs(`{"uuid":"${expectedUuid}","uid":"${expectedUid}"}`,expectedCertContent,expectedSig).returns(true);

    const actual = requestVerification.verifyRequest(req);

    expect(actual).to.equal(true);
    mock.verify();
  });
  it('true is returned if config to not verify requests is set', () => {
    sandbox.stub(config.requestVerification,'isEnabled').get(() => {return false;});
    const mock = sinon.mock(fs);

    mock.expects('readFileSync').never();
    const actual = requestVerification.verifyRequest(req);

    expect(actual).to.equal(true);
    mock.verify();
  });
});
