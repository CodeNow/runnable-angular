'use strict';

var $controller,
    $rootScope,
    $scope,
    $q;

describe('controllerInstanceEdit'.bold.underline.blue, function () {

  beforeEach(function () {
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.value('favico', {
        reset : sinon.spy(),
        setImage: sinon.spy(),
        setInstanceState: sinon.spy()
      });
      $provide.factory('fetchBuild', fixtures.MockFetchBuild.built);
      $provide.factory('fetchInstances', fixtures.mockFetchInstances.running);
    });
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _$q_
    ) {
      $controller = _$controller_;
      $q = _$q_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
    });
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
