'use strict';

describe('sshKeyListController'.bold.underline.blue, function () {
  var $scope;
  var $rootScope;
  var $controller;
  var keypather;
  var fetchGitHubUserById;
  var sshKeyListController;

  describe('base', function () {
    describe('Check the construction fetches the keys', function () {
      beforeEach(function () {
        angular.mock.module('app');
        angular.mock.module(function ($provide) {
          $provide.factory('sshKey', function ($q) {
            var mockGetSshKeys = function() {
              return $q.when({
                data: {
                  keys: [
                    {
                      username: 'Richard',
                      fingerprint: '40:71:04:a8:3b:ea:a8:90:f6:99:6c:7a:22:f7:c0:15',
                      avatar: 'https://avatars1.githubusercontent.com/u/495765',
                      userId: 0
                    },
                    {
                      username: 'Feynman',
                      fingerprint: 'e2:81:ae:03:43:1a:ba:cf:4e:e0:79:37:69:40:58:56',
                      avatar: 'https://avatars1.githubusercontent.com/u/429706',
                      userId: 1
                    },
                    {
                      username: 'Bongos',
                      fingerprint: 'e2:81:ae:03:43:1a:ba:cf:4e:e0:79:37:69:40:58:56',
                      avatar: 'https://avatars1.githubusercontent.com/u/429706',
                      userId: 2
                    }
                  ]
                }
              });
            };

            return {
              getSshKeys: mockGetSshKeys
            };
          });

          $provide.factory('github', function ($q) {
            var mockGetGhScopes = function() {
              return $q.when([
                ['write:public_key']
              ]);
            };

            return {
              getGhScopes: mockGetGhScopes
            };
          });

          $provide.factory('currentOrg', function ($q) {
            var mockGetDisplayName = function() {
              return 'mockName'
            };

            var mockCurrentOrg = {
              getDisplayName: mockGetDisplayName
            };

            keypather.set(mockCurrentOrg, 'poppa.user.attrs.bigPoppaUser.id', 1);

            return mockCurrentOrg;
          });

          $provide.factory('fetchGitHubUserById', function ($q) {
            return function () {
              return $q.when({
                login: 'Jane Doe'
              });
            };
          });
        });

        angular.mock.inject(function (
          _$controller_,
          _$rootScope_,
          _keypather_,
          _fetchGitHubUserById_
        ) {
          $controller = _$controller_;
          $rootScope = _$rootScope_;
          keypather = _keypather_;
          fetchGitHubUserById = _fetchGitHubUserById_;


          $scope = $rootScope.$new();

          sshKeyListController = $controller('SshKeyListController', {
            '$scope': $scope
          });
        });
        $scope.$digest();
      });

      it('constructor', function () {
        expect(sshKeyListController.keys.length).to.equal(3);
        expect(sshKeyListController.keys[0].username).to.equal('Feynman');
      });
    });
  });
});
