'use strict';

var $controller,
    $rootScope,
    $scope,
    $location;
var keypather;
var apiMocks = require('../apiMocks/index');

describe('errorController'.bold.underline.blue, function () {
  function setup(location) {
    angular.mock.module('app', function($provide) {
      $provide.value('$state', {
        params: {
          err: 'asdfasdf'
        }
      });
    });
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _$location_,
      _keypather_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      keypather = _keypather_;
      $location = _$location_;
      sinon.stub($location, 'search').returns(location);
    });

    $controller('ErrorController', {
      '$scope': $scope
    });
  }
  describe('basics'.blue, function () {

    it('should not set anything up without a valid instance on the scope', function () {
      var location = {
        containerUrl: 'dsafasdfadsf',
        redirectUrl: 'adsFDSFADSF',
        ownerName: 'asdfasdfsd',
        instanceName: 'asdfasdfadsfasdfasdf',
        ports: '[34234, 1212, 21312]'
      };
      setup(location);
      $rootScope.$digest();
      expect($scope.err, 'err').to.equal('asdfasdf');
      expect($scope.containerUrl, 'containerUrl').to.equal(location.containerUrl);
      expect($scope.redirectUrl, 'redirectUrl').to.equal(location.redirectUrl);
      expect($scope.ownerName, 'ownerName').to.equal(location.ownerName);
      expect($scope.instanceName, 'instanceName').to.equal(location.instanceName);
      expect($scope.ports, 'ports').to.deep.equal([34234, 1212, 21312]);
      sinon.assert.calledWith($location.search, 'containerUrl', null);
      sinon.assert.calledWith($location.search, 'redirectUrl', null);
      sinon.assert.calledWith($location.search, 'ownerName', null);
      sinon.assert.calledWith($location.search, 'instanceName', null);
      sinon.assert.calledWith($location.search, 'ports', null);
    });

    it('should not set anything up without a valid instance on the scope', function () {
      var location = {
      };
      setup(location);
      $rootScope.$digest();
      expect($scope.containerUrl, 'containerUrl').to.not.be.ok;
      expect($scope.redirectUrl, 'redirectUrl').to.not.be.ok;
      expect($scope.ownerName, 'ownerName').to.not.be.ok;
      expect($scope.instanceName, 'instanceName').to.not.be.ok;
      sinon.assert.neverCalledWith($location.search, 'containerUrl', null);
      sinon.assert.neverCalledWith($location.search, 'redirectUrl', null);
      sinon.assert.neverCalledWith($location.search, 'ownerName', null);
      sinon.assert.neverCalledWith($location.search, 'instanceName', null);
      sinon.assert.neverCalledWith($location.search, 'ports', null);
    });
  });
});
