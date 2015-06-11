'use strict';
describe('editServerModalDirective'.bold.underline.blue, function () {
  var ctx;
  var $timeout;
  var $scope;
  var $compile;
  var $elScope;
  var $rootScope;
  var keypather;
  var parseDockMock = new (require('../fixtures/mockFetch'))();
  var fetchStackAnalysisMock;
  var $q;

  var apiMocks = require('../apiMocks/index');
  function setup(scope) {

    ctx = {};
    ctx.fakeOrg1 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org1';
      }
    };

    runnable.reset(apiMocks.user);
    angular.mock.module('app', function ($provide) {
      $provide.factory('helpCards', helpCardsMock.create(ctx));
      $provide.factory('loadingPromises', function ($q) {
        ctx.loadingPromise = {
          finishedValue: 0,
          add: sinon.spy(function (namespace, promise) {
            return promise;
          }),
          finished: sinon.spy(function () {
            return $q.when(ctx.loadingPromise.finishedValue);
          })
        };
      });
    });
    angular.mock.inject(function (
      _$compile_,
      _$timeout_,
      _$rootScope_,
      _keypather_,
      _$q_
    ) {
      $timeout = _$timeout_;
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      keypather = _keypather_;
      $q = _$q_;
    });


    keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.fakeOrg1);
    Object.keys(scope).forEach(function (key) {
      $scope[key] = scope[key];
    });

    ctx.template = directiveTemplate.attribute('edit-server-modal', {
      'data': 'data',
      'actions': 'actions',
      'current-model': 'currentModel',
      'state-model': 'stateModel',
      'default-actions': 'defaultActions'

    });
    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
    $scope.$digest();
  }
  describe('basic', function () {
  });

  describe('getUpdatePromise', function () {
    it('should only update the instance if nothing has changed', function () {

    });
  });
});