'use strict';

var $rootScope,
  $scope;
var element;
var $compile;
var keypather;
var $q;
var $elScope;
var readOnlySwitchController;
var apiMocks = require('./../../../apiMocks/index');

describe('instanceHeaderDirective'.bold.underline.blue, function () {
  var ctx;
  var mockInstance;
  var mockInstance1;
  var promisifyMock;
  var mockMainACV;
  var mockOpenItems;
  var mockFetchPr;

  beforeEach(function () {
    ctx = {};
  });

  beforeEach(function () {
    ctx.errsMock = {
      handler: sinon.spy()
    };
    ctx.fetchPullRequestMock = {
      hey: 'asfasf'
    };

    ctx.loadingMock = sinon.spy();
    angular.mock.module('app', function ($provide) {
      $provide.value('errs', ctx.errsMock);
      $provide.factory('fetchPullRequest', function ($q) {
        mockFetchPr = sinon.stub().returns($q.when(ctx.fetchPullRequestMock));
        return mockFetchPr;
      });
      $provide.factory('promisify', function ($q) {
        promisifyMock = sinon.spy(function (obj, key) {
          return function () {
            return $q.when(obj[key].apply(obj, arguments));
          };
        });
        return promisifyMock;
      });
    });
    angular.mock.inject(function (_$compile_, _$timeout_, _$rootScope_, _$q_) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      $scope = $rootScope.$new();
      $q = _$q_;

      mockMainACV = {
        attrs: {
          mainACVAttrs: true
        }
      };
      mockInstance = {
        attrs: {
          name: 'foo'
        },
        restart: sinon.spy(),
        fetch: sinon.spy(),
        status: sinon.stub().returns('running'),
        stop: sinon.spy(),
        start: sinon.spy(),
        build: {
          deepCopy: sinon.spy()
        },
        contextVersion: {
          getMainAppCodeVersion: sinon.stub().returns(mockMainACV)
        },
        fetchDependencies: sinon.stub().returns({
          models: []
        }),
        on: sinon.spy()
      };
      mockInstance1 = {
        attrs: {
          name: 'foo123'
        },
        restart: sinon.spy(),
        fetch: sinon.spy(),
        status: sinon.stub().returns('running'),
        stop: sinon.spy(),
        start: sinon.spy(),
        build: {
          deepCopy: sinon.spy()
        },
        contextVersion: {
          getMainAppCodeVersion: sinon.stub().returns(mockMainACV)
        },
        fetchDependencies: sinon.stub().returns({
          models: []
        }),
        on: sinon.spy()
      };

      $scope.instance = mockInstance;

      mockOpenItems = {};

      mockOpenItems.getAllFileModels = sinon.stub().returns(mockOpenItems.models);

      var template = directiveTemplate.attribute('instance-header', {
        instance: 'instance',
        'open-items': 'openItems'
      });
      $rootScope.featureFlags = {
        newNavigation: false
      };

      element = $compile(template)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
    });
  });

  describe('watching instance', function () {
    it('update the pr', function () {
      $scope.instance = mockInstance1;
      mockFetchPr.reset();
      $scope.$digest();
      sinon.assert.calledTwice(mockFetchPr);
      $elScope.pr = ctx.fetchPullRequestMock;
    });
  });
});
