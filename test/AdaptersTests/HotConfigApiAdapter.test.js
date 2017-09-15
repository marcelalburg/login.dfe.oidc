const expect = require('chai').expect;
const sinon = require('sinon');
const request = require('request-promise');
const HotConfigApiAdapter = require('../../src/HotConfig/HotConfigApiAdapter');

const clients = '[{"client_id": "foo", "client_secret": "bar", "redirect_uris": ["http://lvh.me/cb"]}]';

describe('When using the HotConfigApiAdapter', () => {
  describe('and finding clients by Id', function () {

    let adapter;
    let sandbox;

    process.env.CLIENTS_URL = 'clients';

    beforeEach(function(){
      adapter = new HotConfigApiAdapter('Client');
      sandbox = sinon.sandbox.create();
    });
    afterEach(function(){
      sandbox.restore();
    });
    it('the clients are read from the api', function () {
      const mock = sinon.mock(request);
      mock.expects('get').once().returns('[{}]');

      adapter.find('client1');

      mock.verify();
    });
    it('null is returned if there is no data returned in the response', function()  {
      sandbox.stub(request,'get').yields(null, { statusCode: 200 },null);

      return adapter.find('client1').then(function(actual) {
        expect(actual).to.equal(null);
      });

    });
    it('the client is returned if the Id matches the client_id', function(){
      sandbox.stub(request,'get').yields(null, { statusCode: 200 },clients);
      return adapter.find('foo').then( function (actual) {
        expect(actual).to.not.equal(null);
        expect(actual.client_id).to.equal('foo');
      });
    });
    it('null is returned if the Id is not found', function() {
      sandbox.stub(request,'get').yields(null, { statusCode: 200 },clients);

      return adapter.find('foo1').then( function(actual) {
        expect(actual).to.equal(null);
      });

    });
  });
})