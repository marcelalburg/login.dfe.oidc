jest.mock('./../../../src/infrastructure/Config', () => ({
  oidc: {
    redisConnectionString: 'http://clients.local',
  },
  hostingEnvironment: {
  },
  applications: {
    type: 'static',
  },
}));

jest.mock('./../../../src/infrastructure/logger', () => {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
});
jest.useFakeTimers();


const MasterAdapter = require('./../../../src/infrastructure/adapters/MasterAdapter');
const RedisAdapter = require('./../../../src/infrastructure/adapters/RedisAdapter');
const Applications = require('./../../../src/infrastructure/applications/ApplicationsApiAdapter');

describe('When constructing the adapter', () => {
  describe('then if no override is defined', () => {
    it('the RedisAdapter is used', () => {
      const actual = new MasterAdapter('test');
      expect(actual.innerAdapter).toBeInstanceOf(RedisAdapter);
    });
  });
  describe('then if Client is defined as the constructor name', () => {
    it('the Applications is used', () => {
      const actual = new MasterAdapter('Client');
      expect(actual.innerAdapter).toBeInstanceOf(Applications);
    });
  });
});
