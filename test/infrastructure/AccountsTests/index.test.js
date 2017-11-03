jest.mock('./../../../src/infrastructure/Config', () => {
  return {
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
  };
});
jest.mock('login.dfe.jwt-strategies', () => {
  return () => {
    return {
      async getBearerToken() {
        return Promise.resolve('super-secret-super-token');
      },
    };
  };
});
jest.mock('./../../../src/infrastructure/HotConfig', () => {
  return jest.fn().mockImplementation(() => {
    return {
      async find(id) {
        return Promise.resolve({ params: { directoryId: '54321' } });
      },
    };
  });
});
jest.mock('request-promise');

const Accounts = require('./../../../src/infrastructure/Accounts/index');

describe('When constructing the accounts', () => {
  let requestGet;

  const ctx = { oidc: { client: { clientId: '1234' } } };

  beforeEach(() => {
    requestGet = jest.fn().mockReturnValue({
      statusCode: 200,
      body: '{"sub":"123456","name":"Test User", "given_name":"Test", "family_name":"User", "email":"test@test.com"}'
    });
    const request = require('request-promise');
    request.get = requestGet;
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

      expect(requestGet.mock.calls[0][0]).toBe('http://directories.local/54321/user/test');
    });
  });
});
