'use strict';

var $rootScope;
var $scope;
var element;
var $compile;
var $interval;
var $q;
var $elScope;

describe('hangTight'.bold.underline.blue, function () {

  var mockInstance;
  var demoFlowService;
  var mockMainACV;
  var mockOpenItems;

  beforeEach(function () {
    angular.mock.module('app', function ($provide) {
      $provide.factory('demoFlowService', function ($q) {
        demoFlowService = {
          checkStatusOnInstance: sinon.stub().returns($q.when(false)),
          setItem: sinon.stub()
        };
        return demoFlowService;
      });
    });
    angular.mock.inject(function (_$compile_, _$interval_, _$rootScope_, _$q_) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      $interval = _$interval_;
      $scope = $rootScope.$new();
      $q = _$q_;
      sinon.stub($interval, 'cancel');

      mockMainACV = {
        attrs: {
          mainACVAttrs: true
        }
      };
      mockInstance = {
        attrs: {
          name: 'foo'
        },
        restart: sinon.stub(),
        fetch: sinon.stub(),
        status: sinon.stub().returns('running'),
        stop: sinon.stub(),
        start: sinon.stub(),
        build: {
          deepCopy: sinon.stub()
        },
        contextVersion: {
          getMainAppCodeVersion: sinon.stub().returns(mockMainACV)
        },
        fetchDependencies: sinon.stub().returns({
          models: []
        }),
        id: sinon.stub().returns(1),
        on: sinon.stub()
      };
      $scope.instance = mockInstance;

      mockOpenItems = {};

      mockOpenItems.getAllFileModels = sinon.stub().returns(mockOpenItems.models);

      var template = directiveTemplate.attribute('hang-tight', {
        instance: 'instance',
      });

      element = $compile(template)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
    });
  });

  describe('watching instance', function () {
    it('should poll the status until it retuns true', function () {
      $interval.flush(1000);
      $scope.$digest();
      sinon.assert.calledOnce(demoFlowService.checkStatusOnInstance);
      demoFlowService.checkStatusOnInstance = sinon.stub().returns($q.when(true));
      $interval.flush(1000);
      $scope.$digest();
      sinon.assert.calledOnce($interval.cancel);
      sinon.assert.calledOnce(demoFlowService.setItem);
    });
    it('should emit dismissUrlCallout when it tries 15 times', function () {
      $interval.flush(1000);
      $scope.$digest();
      sinon.assert.calledOnce(demoFlowService.checkStatusOnInstance);
      $interval.flush(15000);
      $scope.$digest();
      sinon.assert.calledOnce($interval.cancel);
      sinon.assert.calledOnce(demoFlowService.setItem);
    });
  });
});
