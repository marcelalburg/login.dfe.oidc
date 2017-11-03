// jest.mock('path', () => {
//   const path = require.requireActual('path');
//   const pathToApp = path.resolve(__dirname, '../../../src/app/logout');
//   return {
//     resolve: jest.fn().mockReturnValue(pathToApp),
//   };
// });
jest.mock('fs', () => {
  const readFile = jest.fn().mockImplementation((filePath, opts, done) => {
    done(null, '<ul><li><%=form.title%></li><li><%=form.otherstuff%></li>');
  });
  return {
    readFile,
  };
});

const logoutAction = require('./../../../src/app/logout');


describe('when processing logout', () => {
  let ctx;
  const form = {
    title: 'test',
    otherstuff: 'data data data',
  };

  beforeEach(() => {
    ctx = {};
  });

  it('then it should render html to context body', async () => {
    await logoutAction(ctx, form);

    expect(ctx.body).toBeDefined();
    expect(ctx.body).toBe('<ul><li>test</li><li>data data data</li>');
  })
});