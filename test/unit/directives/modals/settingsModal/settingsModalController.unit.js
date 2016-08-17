/*global expect:true */
'use strict';

var $rootScope;
var $controller;
var $scope;
var $q;
var keypather;

describe('SettingsModalController'.bold.underline.blue, function () {

  var SEMC;
  var tabName = 'hello';
  var closeStub = sinon.stub();

  beforeEach(function () {
    angular.mock.module('app', function ($provide) {
      $provide.value('tab', tabName);
      $provide.value('close', closeStub);
    });
    angular.mock.inject(function (
      _$controller_,
      _$q_,
      _$rootScope_,
      _keypather_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      keypather = _keypather_;
      $scope = $rootScope.$new();
      $q = _$q_;
    });

    keypather.set($rootScope, 'dataApp.data.activeAccount', {});
    SEMC = $controller('SettingsModalController', { $scope: $scope }, true)();
  });

  it('should instantiate the controller correctly', function () {
    expect(SEMC.close).to.equal(closeStub);
    expect(SEMC.currentTab).to.equal(tabName);
  });
});
