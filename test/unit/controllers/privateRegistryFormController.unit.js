'use strict';

describe('privateRegistryFormController'.bold.underline.blue, function () {
  var $scope;
  var $rootScope;
  var $controller;
  var privateRegistryFormController;
  var mockGetRegistryDetails;

  describe('base', function () {
    describe('Check the construction when does not have registry', function () {
      beforeEach(function () {
        angular.mock.module('app');
        angular.mock.module(function ($provide) {
          $provide.factory('privateRegistry', function ($q) {
            mockGetRegistryDetails = function() {
              return null;
            };

            return {
              getRegistryDetails: mockGetRegistryDetails
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

          privateRegistryFormController = $controller('PrivateRegistryFormController', {
            '$scope': $scope
          });
        });
        $scope.$digest();

      });

      it('constructor', function () {
        expect(privateRegistryFormController.registryCredentials).to.be.null;
        expect(privateRegistryFormController.authorized).to.be.false;
        expect(privateRegistryFormController.invalidCredentials).to.be.false;
        expect(privateRegistryFormController.formReset).to.be.false;
      });
    });

    describe('Check the construction when has registry', function () {
      beforeEach(function () {
        angular.mock.module('app');
        angular.mock.module(function ($provide) {
          $provide.factory('privateRegistry', function ($q) {
            mockGetRegistryDetails = function() {
              return {
                username: 'somebody',
                url: 'somewhere'
              };
            };

            return {
              getRegistryDetails: mockGetRegistryDetails
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

          privateRegistryFormController = $controller('PrivateRegistryFormController', {
            '$scope': $scope
          });
        });
        $scope.$digest();
      });

      it('constructor', function() {
        expect(privateRegistryFormController.registryCredentials.username).to.equal('somebody');
        expect(privateRegistryFormController.authorized).to.be.true;
        expect(privateRegistryFormController.invalidCredentials).to.be.false;
        expect(privateRegistryFormController.formReset).to.be.false;
      });
    });
  });
});
