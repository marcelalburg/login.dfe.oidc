const MasterAdapter = require('./../../../src/infrastructure/adapters/MasterAdapter');
const RedisAdapter = require('./../../../src/infrastructure/adapters/RedisAdapter');
const HotConfigAdapter = require('./../../../src/infrastructure/HotConfig/HotConfigAdapter');

describe('When constructing the adapter', () => {
  describe('then if no override is defined', () => {
    it('the RedisAdapter is used', () => {
      const actual = new MasterAdapter('test');
      expect(actual.innerAdapter).toBeInstanceOf(RedisAdapter);
    });
  });
  describe('then if Client is defined as the constructor name', () => {
    it('the HotConfigAdapter is used', () => {
      const actual = new MasterAdapter('Client');
      expect(actual.innerAdapter).toBeInstanceOf(HotConfigAdapter);
    });
  });
});
