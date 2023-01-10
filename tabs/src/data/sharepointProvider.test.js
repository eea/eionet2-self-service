const apiProvider = require('./apiProvider');
const provider = require('./sharepointProvider');

jest.mock('./apiProvider');

test('getGenderList', () => {
  apiProvider.apiGet.mockImplementation(() => {
    return Promise.resolve({
      graphClientMessage: {
        value: [{}],
      },
    });
  });

  apiProvider.getConfiguration.mockImplementation(() => {
    return Promise.resolve({
      graphClientMessage: {
        value: [
          {
            fields: {
              Title: 'SharepointSiteId',
              Value: '',
            },
          },
        ],
      },
    });
  });

  provider.getGenderList().then((data) => expect(data).toEqual([]));
});
