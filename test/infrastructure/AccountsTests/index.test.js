jest.mock('./../../../src/infrastructure/logger', () => {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
});
jest.mock('agentkeepalive', () => ({
  HttpsAgent: jest.fn(),
}));
jest.mock('./../../../src/infrastructure/Config', () => ({
  hostingEnvironment: {
    agentKeepAlive: {},
  },
  accounts: {
    url: 'http://directories.local/',
  },
  loggerSettings: {
    colors: {
      info: 'yellow',
      ok: 'green',
      error: 'red',
    },
  },
}));
jest.mock('login.dfe.jwt-strategies', () => () => ({
  async getBearerToken() {
    return Promise.resolve('super-secret-super-token');
  },
}));
jest.mock('./../../../src/infrastructure/applications/ApplicationsApiAdapter', () => jest.fn().mockImplementation(() => ({
  async find(id) {
    return Promise.resolve({ params: { } });
  },
})));
jest.mock('request-promise');
jest.mock('uuid/v4');


const request = require('request-promise');


describe('When constructing the accounts', () => {
  let requestGet;
  let uuid;
  let uuidStub;
  const correlationId = '2aea53ee-5413-470e-a35e-378a3375a6fe';
  const generatedId = '466effad-fc07-4d70-aca6-ca6f196bc673';
  let Accounts;
  let ctx = { oidc: { client: { clientId: '1234' } }, req: { id: correlationId } };

  beforeAll(() => {
    requestGet = jest.fn();
    request.defaults.mockReturnValue({
      get: requestGet,
    });
  });
  beforeEach(() => {
    requestGet.mockReset().mockReturnValue({
      statusCode: 200,
      body: '{"sub":"123456","name":"Test User", "given_name":"Test", "family_name":"User", "email":"test@test.com"}',
    });

    uuidStub = jest.fn().mockReturnValue(generatedId);
    uuid = require('uuid/v4');
    uuid.mockImplementation(uuidStub);

    Accounts = require('./../../../src/infrastructure/Accounts');
  });

  describe('and calling findby id', () => {
    it('the API is called', async () => {
      await Accounts.findById(ctx, 'test');

      expect(requestGet.mock.calls.length).toBe(1);
    });

    it('the auth header is added to the request', async () => {
      await Accounts.findById(ctx, 'test');

      expect(requestGet.mock.calls[0][1]).toMatchObject({
        auth: {
          bearer: 'super-secret-super-token',
        },
      });
    });

    it('null is returned if there is no data returned in the response', async () => {
      requestGet.mockReturnValue({
        statusCode: 200,
      });

      const actual = await Accounts.findById(ctx, 'test');

      expect(actual).toBe(null);
    });

    it('null is returned if the Id is not found', async () => {
      requestGet.mockReturnValue({
        statusCode: 200,
        body: '',
      });

      const actual = await Accounts.findById(ctx, 'foo1');

      expect(actual).toBe(null);
    });

    it('a new account object is returned with claims if found', async () => {
      const actual = await Accounts.findById(ctx, 'test@test.com');

      expect(actual).toBeInstanceOf(Accounts);
      expect(actual.claims().sub).toBe('123456');
    });

    it('then the client directory id is returned and added to the url', async () => {
      await Accounts.findById(ctx, 'test');

      expect(requestGet.mock.calls[0][0]).toBe('http://directories.local/users/test');
    });
    it('then the correlation id is added to the headers', async () => {
      await Accounts.findById(ctx, 'test');

      expect(requestGet.mock.calls[0][1]).toMatchObject({
        headers: {
          'x-correlation-id': correlationId,
        },
      });
    });
    it('then the correlation id is generated if it does not exist', async () => {
      ctx = { oidc: { client: { clientId: '1234' } }};

      await Accounts.findById(ctx, 'test');

      expect(requestGet.mock.calls[0][1]).toMatchObject({
        headers: {
          'x-correlation-id': generatedId,
        },
      });
    });
  });
});
