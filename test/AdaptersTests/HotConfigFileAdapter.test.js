const expect = require('chai').expect;
const sinon = require('sinon');
const file = require('fs');
const path = require('path');
const HotConfigFileAdapter = require('../../src/HotConfig/HotConfigFileAdapter');

const clients = '[{"client_id": "foo", "client_secret": "bar", "redirect_uris": ["http://lvh.me/cb"]}]';

describe('When using the HotConfigFileAdapter', () => {
  describe('and finding clients by Id', function () {

    let adapter;
    let sandbox;

    beforeEach(function(){
      adapter = new HotConfigFileAdapter('Client');
      sandbox = sinon.sandbox.create();
    });
    afterEach(function(){
      sandbox.restore();
    });
    it('the clients are read from the clients.json in app_data', function () {
      const mock = sinon.mock(file);
      mock.expects('readFileSync').withArgs(path.resolve('./app_data/clients.json'), {encoding: 'utf8' }).once().returns('[{}]');

      adapter.find('client1');

      mock.verify();
    });
    it('null is returned if there is no data in the file', function()  {
      sandbox.stub(file,'readFileSync').returns(null);

      return adapter.find('client1').then( function(actual) {
        expect(actual).to.equal(null);
      });

    });
    it('the client is returned if the Id matches the client_id', function(){
      sandbox.stub(file,'readFileSync').returns(clients);
      return adapter.find('foo').then( function(actual) {
        expect(actual).to.not.equal(null);
        expect(actual.client_id).to.equal('foo');
      });
    });
    it('null is returned if the Id is not found', function() {
      sandbox.stub(file,'readFileSync').returns(clients);

      return adapter.find('foo1').then( function(actual) {
        expect(actual).to.equal(null);
      });
    });
  });
})
