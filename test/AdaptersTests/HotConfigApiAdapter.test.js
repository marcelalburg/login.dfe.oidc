const expect = require('chai').expect;
const sinon = require('sinon');
const request = require('request-promise');

const proxyquire = require('proxyquire');

const clients = '[{"client_id": "foo", "client_secret": "bar", "redirect_uris": ["http://lvh.me/cb"]}]';

const epectedClientsUrl = 'http://clients.local';
const expectedClientsToken = 'super-secret-super-token';


describe('When using the HotConfigApiAdapter', () => {
  describe('and finding clients by Id', () => {
    let adapter;
    let sandbox;
    let HotConfigApiAdapter;

    const configStub = {
      hotConfig: {
        url: epectedClientsUrl,
      },
    };
    beforeEach(() => {
      HotConfigApiAdapter = proxyquire('../../src/HotConfig/HotConfigApiAdapter', {
        '../Config': configStub,
        '../helpers/jwt_strategies': function (config) {
          return {
            async getBearerToken() {
              return Promise.resolve(expectedClientsToken);
            },
          };
        },
      });

      adapter = new HotConfigApiAdapter('Client');
      sandbox = sinon.sandbox.create();
    });
    afterEach(() => {
      sandbox.restore();
    });
    it('the clients are read from the api', async () => {
      const mock = sinon.mock(request);
      mock.expects('get').once().returns('[{}]');

      await adapter.find('client1');
      mock.verify();
    });
    it('the auth header is added to the request', async () => {
      const mock = sinon.mock(request);
      mock.expects('get').once().withArgs(epectedClientsUrl, {
        auth: {
          bearer: expectedClientsToken,
        },
        strictSSL: false,
        resolveWithFullResponse: true,
      }).returns('[{}]');

      await adapter.find('client1');

      mock.verify();
    });
    it('null is returned if there is no data returned in the response', async () => {
      sandbox.stub(request, 'get').returns(null, {statusCode: 200}, null);

      const actual = await adapter.find('client1');
      expect(actual).to.equal(null);
    });
    it('the client is returned if the Id matches the client_id', async () => {
      sandbox.stub(request, 'get').returns({statusCode: 200, body: clients});

      const actual = await adapter.find('foo');
      expect(actual).to.not.equal(null);
      expect(actual.client_id).to.equal('foo');
    });
    it('null is returned if the Id is not found', () => {
      sandbox.stub(request, 'get').returns({statusCode: 200, body: clients});

      return adapter.find('foo1').then((actual) => {
        expect(actual).to.equal(null);
      });
    });
  });
});
