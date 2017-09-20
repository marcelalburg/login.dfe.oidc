const expect = require('chai').expect;
const sinon = require('sinon');
const fs = require('fs');
const config = require('../../src/Config');
const RequestVerification = require('../../src/RequestVerification/RequestVerification');
const digitalSignatureService = require('../../src/Utils/DigitalSignatureService');

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

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(config.requestVerification,'isEnabled').get(() => {return true;});
  });
  afterEach(function(){
    sandbox.restore();
  });
  it('the interactions certification is loaded', () => {
    sandbox.stub(digitalSignatureService, 'verifySignature').returns(true);
    const mock = sinon.mock(fs);

    mock.expects('readFileSync').once().withArgs('./ssl/interactions.cert', 'utf8').returns('abcdefg');

    RequestVerification.verifyRequest(req);

    mock.verify();
  });
  it('the uuid and uid are used for the verification', () => {
    const mock = sinon.mock(digitalSignatureService);

    mock.expects('write').once().withArgs(`{"uuid":"${expectedUuid}","uid":"${expectedUid}"}`);

    RequestVerification.verifyRequest(req);

    mock.verify();
  });
  it('the verify function is called passing in the signature and public key', () => {
    const expectedCertContent = 'abcdefg';
    const mock = sinon.mock(fs);
    mock.expects('readFileSync').once().withArgs('./ssl/interactions.cert', 'utf8').returns(expectedCertContent);
    sandbox.stub(digitalSignatureService, 'write');
    sandbox.stub(digitalSignatureService, 'verifySignature').withArgs(expectedCertContent,expectedSig).returns(true);

    const actual = RequestVerification.verifyRequest(req);

    expect(actual).to.equal(true);
    mock.verify();
  });
  it('true is returned if config to not verify requests is set', () => {
    sandbox.stub(config.requestVerification,'isEnabled').get(() => {return false;});
    const mock = sinon.mock(fs);

    mock.expects('readFileSync').never();
    const actual = RequestVerification.verifyRequest(req);

    expect(actual).to.equal(true);
    mock.verify();
  });
});
