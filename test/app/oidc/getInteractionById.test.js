jest.mock('./../../../src/app/oidc/oidcServer', () => {
  return {
    Session: {
      find: jest.fn(),
    },
  };
});

const oidc = require('./../../../src/app/oidc/oidcServer');
const getInteractionById = require('./../../../src/app/oidc/getInteractionById');

describe('When getting interaction by id in api', () => {
  let req;
  let res;

  beforeEach(() => {
    oidc.Session.find.mockReset().mockReturnValue({
      uuid: 'interaction-id',
      params: {
        client_id: 'unittest',
        redirect_uri: 'https://unit.tests.local',
      },
    });

    req = {
      params: {
        grant: 'interaction-id',
      },
    };

    res = {
      status: jest.fn(),
      send: jest.fn(),
      json: jest.fn(),
    };
    res.status.mockReturnValue(res);
  });

  it('then it should return details about interaction when still valid', async () => {
    await getInteractionById(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      client_id: 'unittest',
      redirect_uri: 'https://unit.tests.local',
    });
  });

  it('then it should return 404 if session not found', async () => {
    oidc.Session.find.mockReturnValue(undefined);

    await getInteractionById(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it('then it should return 404 if session no longer valid (oidc will return object with only requested id)', async () => {
    oidc.Session.find.mockReturnValue({ id: req.params.id });

    await getInteractionById(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledTimes(1);
  });
});
