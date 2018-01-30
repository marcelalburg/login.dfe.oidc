jest.mock('./../../../src/infrastructure/Config', () => ({
  hotConfig: {
    url: 'http://clients.local',
  },
}));
jest.mock('./../../../src/infrastructure/logger');
jest.mock('login.dfe.jwt-strategies', () => () => ({
  async getBearerToken() {
    return Promise.resolve('super-secret-super-token');
  },
}));
jest.mock('login.dfe.audit.winston-sequelize-transport');
jest.mock('request-promise');
jest.mock('uuid/v4');

const HotConfigApiAdapter = require('./../../../src/infrastructure/HotConfig/HotConfigApiAdapter');

describe('When using the HotConfigApiAdapter', () => {
  describe('and finding clients by Id', () => {
    let requestGet;
    let adapter;
    let uuid;
    let uuidStub;
    const generatedId = '1dcf73dd-1613-470e-a35e-378a3375a6fe';

    beforeEach(() => {
      requestGet = jest.fn().mockReturnValue({
        statusCode: 200,
        body: '[{"client_id": "foo", "client_secret": "bar", "redirect_uris": ["http://lvh.me/cb"]}]',
      });
      const request = require('request-promise');
      request.get = requestGet;

      uuidStub = jest.fn().mockReturnValue(generatedId);
      uuid = require('uuid/v4');
      uuid.mockImplementation(uuidStub);

      adapter = new HotConfigApiAdapter('Client');
    });

    it('the clients are read from the api', async () => {
      await adapter.find('client1');

      expect(requestGet.mock.calls.length).toBe(1);
      expect(requestGet.mock.calls[0][0]).toBe('http://clients.local');
    });

    it('the auth header is added to the request', async () => {
      await adapter.find('client1');

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

      const actual = await adapter.find('client1');

      expect(actual).toBe(null);
    });

    it('the client is returned if the Id matches the client_id', async () => {
      const actual = await adapter.find('foo');

      expect(actual).not.toBeNull();
      expect(actual.client_id).toBe('foo');
    });

    it('null is returned if the Id is not found', async () => {
      const actual = await adapter.find('foo1');

      expect(actual).toBeNull();
    });
    it('the correlation Id is taken from ctx if passed and added to the header', async () => {
      const ctx = { req: { id: '123456' } };

      await adapter.find('client1',ctx);

      expect(requestGet.mock.calls[0][1]).toMatchObject({
        headers: {
          'x-correlation-id': '123456',
        },
      });
    });
    it('the correlation Id is generated if one does not exist', async () => {
      await adapter.find('client1');

      expect(requestGet.mock.calls[0][1]).toMatchObject({
        headers: {
          'x-correlation-id': generatedId,
        },
      });
    });
  });
});
