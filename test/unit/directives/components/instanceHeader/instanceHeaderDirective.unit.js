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
    ctx.fetchPullRequestMock = {};

    ctx.loadingMock = sinon.spy();
    angular.mock.module('app', function ($provide) {
      $provide.value('errs', ctx.errsMock);
      $provide.factory('fetchPullRequest', function ($q) {
        return $q.when(ctx.fetchPullRequest);
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
      $scope.instance = mockInstance;
      $scope.openItems = mockOpenItems;
      element = $compile(template)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
    });
  });

  describe('watching instance', function () {

    var classesMap = {
      starting: ['gray', 'in'],
      stopping: ['gray', 'in'],
      building: ['gray', 'in'],
      stopped: ['gray'],
      crashed: ['red'],
      running: ['gray'],
      buildFailed: ['red'],
      neverStarted: ['gray'],
      unknown: ['gray']
    };
    it('update the button text correctly', function () {
      mockInstance.status = sinon.stub();

      Object.keys(classesMap).forEach(function (status) {
        mockInstance.status.reset();
        mockInstance.status = sinon.stub().returns(status);
        $elScope.$digest();
        expect(classesMap[status], 'status ' + status).to.deep.equal($elScope.getClassForInstance());
      });

    });
  });
});
