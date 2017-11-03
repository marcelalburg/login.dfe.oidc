jest.mock('fs');
jest.mock('path', () => {
  return {
    resolve: (relative) => {
      return `./${relative}`;
    },
  };
});

const HotConfigFileAdapter = require('./../../../src/infrastructure/HotConfig/HotConfigFileAdapter');

describe('When using the HotConfigFileAdapter', () => {
  describe('and finding clients by Id', () => {
    let fsReadFile;

    let adapter;

    beforeEach(() => {
      fsReadFile = jest.fn().mockImplementation((filePath, opts, done) => {
        done(null, '[{"client_id": "foo", "client_secret": "bar", "redirect_uris": ["http://lvh.me/cb"]}]');
      });
      const fs = require('fs');
      fs.readFile = fsReadFile;

      adapter = new HotConfigFileAdapter('Client');
    });

    it('the clients are read from the clients.json in app_data', async () => {
      await adapter.find('client1');

      expect(fsReadFile.mock.calls.length).toBe(1);
      expect(fsReadFile.mock.calls[0][0]).toBe('./app_data/clients.json');
      expect(fsReadFile.mock.calls[0][1]).toMatchObject({ encoding: 'utf8' });
    });

    it('null is returned if there is no data in the file', async () => {
      fsReadFile.mockImplementation((filePath, opts, done) => {
        done(null, null);
      });

      const actual = await adapter.find('client1');

      expect(actual).toBeNull();
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
  });
});
