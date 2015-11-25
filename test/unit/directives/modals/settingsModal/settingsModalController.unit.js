'use strict';
var mockUserFetch = new (require('../fixtures/mockFetch'))();

var $controller;
var $scope;
var $q;

describe('SettingsModalController'.bold.underline.blue, function () {

  var SEMC;
  var fetchUserStub;

  beforeEach(function (done) {

    angular.mock.module('app', function ($provide) {
      $provide.factory('fetchUser', mockUserFetch.fetch());
    });
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _$q_,
      _$timeout_
    ) {
      $controller = _$controller_;
      $scope = _$rootScope_.$new();
      $q = _$q_;
    });

    SEMC = $controller('SettingsModalController', { $scope: $scope }, true)();
  });

  describe('', function () {

  });
});
