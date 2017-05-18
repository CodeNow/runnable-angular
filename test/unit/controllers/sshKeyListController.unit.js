'use strict';

describe('sshKeyListController'.bold.underline.blue, function () {
  var $scope;
  var $rootScope;
  var $controller;
  var sshKeyListController;

  describe('base', function () {
    describe('Check the construction fetches the keys', function () {
      beforeEach(function () {
        angular.mock.module('app');
        angular.mock.module(function ($provide) {
          $provide.factory('sshKey', function ($q) {
            var mockGetSshKeys = function() {
              return $q.when({json: {
                keys: [
                  {
                    username: 'Richard',
                    fingerprint: '40:71:04:a8:3b:ea:a8:90:f6:99:6c:7a:22:f7:c0:15',
                    avatar: 'https://avatars1.githubusercontent.com/u/495765'
                  },
                  {
                    username: 'Feynman',
                    fingerprint: 'e2:81:ae:03:43:1a:ba:cf:4e:e0:79:37:69:40:58:56',
                    avatar: 'https://avatars1.githubusercontent.com/u/429706'
                  },
                  {
                    username: 'Bongos',
                    fingerprint: 'e2:81:ae:03:43:1a:ba:cf:4e:e0:79:37:69:40:58:56',
                    avatar: 'https://avatars1.githubusercontent.com/u/429706'
                  }
                ]
              }});
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
            var mockGithub = {
              oauthName: function () {
                return 'Feynman';
              }
            };

            return {
              github: mockGithub
            };
          });
        });
        angular.mock.inject(function (
          _$controller_,
          _$rootScope_
        ) {
          $controller = _$controller_;
          $rootScope = _$rootScope_;

          $scope = $rootScope.$new();

          sshKeyListController = $controller('SshKeyListController', {
            '$scope': $scope
          });
        });
        $scope.$digest();
      });

      it('constructor', function () {
        console.log(sshKeyListController);
        expect(sshKeyListController.keys.length).to.equal(3);
        expect(sshKeyListController.keys[0].username).to.equal('Feynman');
      });
    });
  });
});
