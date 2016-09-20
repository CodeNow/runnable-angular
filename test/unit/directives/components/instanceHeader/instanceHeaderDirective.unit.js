'use strict';

var $rootScope,
  $scope;
var element;
var $compile;
var isRunnabotPartOfOrgStub;
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

      $provide.factory('instanceBoxNameDirective', function () {
        return {
          priority: 100000,
          terminal: true,
          link: angular.noop
        };
      });
      $provide.value('errs', ctx.errsMock);
      $provide.factory('fetchPullRequest', function ($q) {
        mockFetchPr = sinon.stub().returns($q.when(ctx.fetchPullRequestMock));
        return mockFetchPr;
      });
      $provide.factory('containerStatusButtonDirective', function () {
        return {
          priority: 100000,
          terminal: true,
          link: angular.noop
        };
      });
      $provide.factory('containerUrlDirective', function () {
        return {
          priority: 100000,
          terminal: true,
          link: angular.noop
        };
      });
      $provide.factory('saveOpenItemsButtonDirective', function () {
        return {
          priority: 100000,
          terminal: true,
          link: angular.noop
        };
      });
      $provide.factory('dnsConfigurationDirective', function () {
        return {
          priority: 100000,
          terminal: true,
          link: angular.noop
        };
      });
      $provide.factory('isRunnabotPartOfOrg', function ($q) {
        isRunnabotPartOfOrgStub = sinon.stub().returns($q.when());
        return isRunnabotPartOfOrgStub;
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
        newNavigation: true
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
      sinon.assert.calledOnce(mockFetchPr);
      $elScope.pr = ctx.fetchPullRequestMock;
    });
  });
});
