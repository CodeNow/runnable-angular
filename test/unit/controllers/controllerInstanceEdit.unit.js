'use strict';

var $controller,
    $httpBackend,
    $rootScope,
    $scope,
    $q;

describe('controllerInstanceEdit'.bold.underline.blue, function () {

  beforeEach(function () {
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.factory('fetchBuild', fixtures.MockFetchBuild.built);
    });
    angular.mock.inject(function (
      _$controller_,
      _$httpBackend_,
      _$rootScope_,
      _$q_
    ) {
      $controller = _$controller_;
      $httpBackend = _$httpBackend_;
      $q = _$q_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
    });

    var userUrl = host + '/users/me?';
    $httpBackend
      .whenGET(userUrl)
      .respond(mocks.user);
  });

  it('initalizes basic scope', function () {

    var $scope = $rootScope.$new();

    var ci = $controller('ControllerInstanceEdit', {
      '$scope': $scope
    });
    $rootScope.$digest();

    expect($scope).to.have.property('dataInstanceEdit');
    expect($scope).to.have.deep.property('dataInstanceEdit.actions');
    expect($scope).to.have.deep.property('dataInstanceEdit.data');
    expect($scope).to.have.deep.property('dataInstanceEdit.data.loading');
    expect($scope).to.have.deep.property('dataInstanceEdit.data.showExplorer');

    $scope.$apply();

  });

});
