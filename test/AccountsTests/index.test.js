const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const request = require('request-promise');
const HotConfig = require('../../src/HotConfig/HotConfigFileAdapter')

const expectedDirectoriesUrl = 'http://directories.local';
const expectedDirectoriesToken = 'super-secret-super-token';

describe('When constructing the accounts', () => {
  const configStub = {
    accounts: {
      url: expectedDirectoriesUrl,
    },
  };

  let sandbox;
  let Accounts;
  let hotconfigApiAdapter
  const ctx = {oidc:{client:{clientId: '1234' }}};

  beforeEach(() => {
    Accounts = proxyquire('../../src/Accounts/index', {
      '../Config': configStub,
      'login.dfe.jwt-strategies': function (config) {
        return {
          async getBearerToken() {
            return Promise.resolve(expectedDirectoriesToken);
          },
        };
      },
      '../HotConfig': function() {
        return {
          async find(id) {
            return Promise.resolve({params:{directoryId: '54321'}});
          },
        };
      },
    });
    hotconfigApiAdapter = new HotConfig();
    sandbox = sinon.sandbox.create();
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('and calling findby id', () => {
    it('the API is called', async () => {
      const mock = sinon.mock(request);
      mock.expects('get').once().returns('[{}]');

      await Accounts.findById(ctx,'test');

      mock.verify();
    });
    it('the auth header is added to the request', async () => {
      const mock = sinon.mock(request);
      mock.expects('get').once().withArgs('http://directories.local/54321/user/test', {
        auth: {
          bearer: expectedDirectoriesToken,
        },
        strictSSL: false,
        resolveWithFullResponse: true,
      }).returns('[{}]');

      await Accounts.findById(ctx, 'test');

      mock.verify();
    });
    it('null is returned if there is no data returned in the response', async () => {
      sandbox.stub(request, 'get').returns(null, { statusCode: 200 }, null);

      Accounts.findById(ctx,'test').then((actual) => {
        expect(actual).to.equal(null);
      });
    });
    it('null is returned if the Id is not found', () => {
      sandbox.stub(request, 'get').returns({ statusCode: 200, body: '' });

      return Accounts.findById(ctx,'foo1').then((actual) => {
        expect(actual).to.equal(null);
      });
    });
    it('a new account object is returned with claims if found', () => {
      sandbox.stub(request, 'get').returns({ statusCode: 200, body: '{"id":"123456","name":"Test User", "given_name":"Test", "family_name":"User", "email":"test@test.com"}' });

      return Accounts.findById(ctx,'test@test.com').then((actual) => {
        expect(actual).to.be.instanceOf(Accounts);
        expect(actual.claims().sub).to.equal('123456');
      });
    });
    it('then the client directory id is returned and added to the url', async () => {
      const mock = sinon.mock(request);
      mock.expects('get').once().withArgs('http://directories.local/54321/user/test', {
        auth: {
          bearer: expectedDirectoriesToken,
        },
        strictSSL: false,
        resolveWithFullResponse: true,
      }).returns('[{}]');

      await Accounts.findById(ctx, 'test');

      mock.verify();
    });
  });
});
