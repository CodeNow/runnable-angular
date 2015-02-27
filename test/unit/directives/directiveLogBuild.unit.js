'use strict';

var jQuery  = require('jquery');
var sinon = require('sinon');
var pluck = require('101/pluck');
var find = require('101/find');
var matches = function (regexp) {
  return function (v) {
    return regexp.test(v);
  };
};

// injector-provided
var $compile,
    $filter,
    $provide,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    user;
var $elScope;
var mockPrimus = new fixtures.MockPrimus();

describe('directiveLogBuild'.bold.underline.blue, function() {
  var ctx;

  function injectSetupCompile () {
    angular.mock.module(function ($provide) {
      $provide.value('primus', mockPrimus);
      $provide.factory('fetchInstances', fixtures.mockFetchInstances.running);
    });
    angular.mock.inject(function (
      _$compile_,
      _$filter_,
      _$rootScope_,
      _$state_,
      _$stateParams_,
      _$timeout_,
      _user_
    ) {
      $compile = _$compile_;
      $filter = _$filter_;
      $rootScope = _$rootScope_;
      $state = _$state_;
      $stateParams = _$stateParams_;
      $scope = _$rootScope_.$new();
      $timeout = _$timeout_;
      user = _user_;
    });

    modelStore.reset();

    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
  }

  beforeEach(angular.mock.module('app'));

  beforeEach(function() {
    ctx = {};
    ctx.template = directiveTemplate.attribute('log-build', {
      'ng-controller': 'BuildLogController'
    });

  });
  beforeEach(injectSetupCompile);

  it('basic dom', function() {
    var $el = ctx.element[0].querySelector('.terminal');
    expect($el).to.be.ok;
  });

  //it('basic scope', function() {
  //  expect($scope).to.have.property('model');
  //});

  describe('destroy', function() {
    var origBuildStream;
    beforeEach(function () {
      origBuildStream = $scope.stream;
      $scope.stream = {}; // mock buildStream
    });
    afterEach(function () {
      $scope.stream = origBuildStream;
    });
    it('should clean up buildStream', function() {
      var removeAllSpy = sinon.spy();
      var endSpy = sinon.spy();
      $scope.stream.removeAllListeners = removeAllSpy;
      $scope.stream.end = endSpy;
      $scope.$destroy();
      expect(removeAllSpy.called).to.be.ok;
      expect(endSpy.called).to.be.ok;
    });
  });

  describe('primus goes offline', function() {
    it('should display disconnect message when primus goes offline', function() {
      mockPrimus.emit('offline');
      var $el = ctx.element[0].querySelector('.terminal');
      expect($el).to.be.ok;
      expect($el.innerHTML).to.match(/LOST.*CONNECTION/);
    });
  });
});
