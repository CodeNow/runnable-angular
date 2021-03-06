'use strict';

var fetchChatMembersAndMapToUsers;
var $rootScope;
var keypather;

describe('servicefetchChatMembersAndMapToUsers', function () {
  var mockSettings = {
    attrs: {
      notifications: {
        slack: {
          apiToken: '123',
          githubUsernameToSlackIdMap: {
            valentina: 'hullo'
          }
        }
      }
    }
  };
  var mockIntegrationsCache = {
    Jeb: {}
  };

  beforeEach(function () {
    angular.mock.module('app', function ($provide) {
      $provide.factory('verifySlackAPITokenAndFetchMembers', function ($q) {
        return function (token) {
          return $q.when([{
            real_name: 'bill',
            id: 'snacks'
          }, {
            real_name: 'bob',
            id: 'not snacks'
          }, {
            real_name: 'valentina',
            id: 'hullo'
          }]);
        };
      });
      $provide.factory('fetchGitHubMembers', function ($q) {
        return function (username) {
          return $q.when([{
            login: 'bill'
          }, {
            login: 'jeb'
          }, {
            login: 'valentina'
          }]);
        };
      });
      $provide.factory('fetchGitHubUser', function ($q) {
        return function (username) {
          return $q.when({
            name: username,
            login: username
          });
        };
      });

      $provide.value('integrationsCache', mockIntegrationsCache);
      $provide.value('$state', {
        params: {
          userName: 'Jeb'
        }
      });
    });
    angular.mock.inject(function (
      _$rootScope_,
      _fetchChatMembersAndMapToUsers_,
      _keypather_
    ) {
      fetchChatMembersAndMapToUsers = _fetchChatMembersAndMapToUsers_;
      keypather = _keypather_;
      $rootScope = _$rootScope_;
      $rootScope.$apply();
    });
  });

  it('filters regular responses with an empty cache', function (done) {
    var slackApiToken = mockSettings.attrs.notifications.slack.apiToken;
    fetchChatMembersAndMapToUsers(slackApiToken, mockSettings, 'slack')
    .then(function (results) {
      expect(results.github).to.deep.equal(['jeb']);
      expect(results.slack).to.deep.equal([{
          real_name: 'bill',
          id: 'snacks',
          found: true,
          ghName: 'bill'
        }, {
          real_name: 'bob',
          id: 'not snacks'
        }, {
          real_name: 'valentina',
          id: 'hullo',
          slackOn: true,
          found: true,
          ghName: 'valentina'
        }
      ]);
      done();
    });
    $rootScope.$apply();
  });

  it('returns early if cache is valid', function (done) {
    keypather.set(mockIntegrationsCache, 'Jeb.settings.attrs.notifications.slack.apiToken', '123');
    mockIntegrationsCache.Jeb.github = ['bill'];
    fetchChatMembersAndMapToUsers(mockSettings)
    .then(function (results) {
      expect(results).to.deep.equal(mockIntegrationsCache.Jeb);
      done();
    });
    $rootScope.$apply();
  });
});
