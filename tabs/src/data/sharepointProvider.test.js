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

test('getGenderList', () => {
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

  apiProvider.apiGet.mockImplementation(() => {
    return Promise.resolve({
      graphClientMessage: {
        value: [
          {
            name: 'Gender',
            choice: {
              choices: ['Male', 'Female'],
            },
          },
        ],
      },
    });
  });

  provider
    .getGenderList()
    .then((data) => expect(data).toEqual(['Male', 'Female']));
});
