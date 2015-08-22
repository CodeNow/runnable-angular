'use strict';

var $scope;
var $compile;
var $timeout;

describe('BuildLogsDirective'.bold.underline.blue, function () {
  var mockBuildLogsController;
  var element;
  var $elScope;
  var mockDebounce;
  var scrollHelperSpy;

  function setup() {
    mockDebounce = sinon.spy(function (cb) {
      return scrollHelperSpy = sinon.spy(function () {
        cb();
      });
    });
    var buildLogsController = function () {
      this.buildLogs = [];
      this.buildLogsRunning = true;
      mockBuildLogsController = this;
    };
    angular.mock.module('app', function ($provide, $controllerProvider) {
      $controllerProvider.register('BuildLogsController', buildLogsController);
      $provide.value('debounce', mockDebounce);
    });
    angular.mock.inject(function (
      _$rootScope_,
      _$compile_,
      _$timeout_
    ) {
      $scope = _$rootScope_.$new();
      $compile = _$compile_;
      $timeout = _$timeout_;
    });

    var tpl = directiveTemplate.attribute('build-logs', {
      'instance': 'instance'
    });
    element = $compile(tpl)($scope);
    $elScope = element.isolateScope();
    $scope.$digest();
  }
  describe('basics'.blue, function () {
    beforeEach(function () {
      setup();
    });
    it('should recalculate scroll position on new build log', function () {
      scrollHelperSpy.reset();
      mockBuildLogsController.buildLogs.push({
        content: [],
        command: 'Hello'
      });
      $scope.$digest();
      sinon.assert.called(scrollHelperSpy);
    });
    it('should recalculate scroll position on new content', function () {
      scrollHelperSpy.reset();
      mockBuildLogsController.buildLogs.push({
        content: [],
        command: 'Hello'
      });
      $scope.$digest();
      scrollHelperSpy.reset();
      mockBuildLogsController.buildLogs[0].content.push('New Content!');
      $scope.$digest();
      sinon.assert.calledOnce(scrollHelperSpy);
    });
    it('should recalculate when the element scrolls', function () {
      scrollHelperSpy.reset();
      element.triggerHandler('scroll');
      $scope.$digest();
      sinon.assert.calledOnce(scrollHelperSpy);
    });
  });
});
