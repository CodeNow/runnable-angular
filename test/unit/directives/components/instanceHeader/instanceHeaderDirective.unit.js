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
  var promisifyMock;
  var mockMainACV;
  var mockOpenItems;

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
      $provide.value('fetchPullRequest', function () {
        return $q.when(ctx.fetchPullRequestMock);
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
        }
      };
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
      expect($elScope.pr, 'pr').to.not.be.ok;
      $scope.instance = mockInstance;
      $scope.$digest();
      expect($elScope.pr, 'pr').to.deep.equal(ctx.fetchPullRequestMock);
    });

    it('should update nothing when the pr is empty', function () {
      ctx.fetchPullRequestMock = null;
      $scope.instance = mockInstance;
      $scope.$digest();
      expect($elScope.pr, 'pr').to.not.be.ok;
    });
  });
});
