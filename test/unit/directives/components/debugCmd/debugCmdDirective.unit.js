'use strict';

var $controller;
var $scope;
var $q;
var $timeout;
var $rootScope;
var EventEmitter = require('events').EventEmitter;
var $compile;

describe('debugCmdDirective'.bold.underline.blue, function () {

  var mockStreamingLog;
  var mockPrimus;
  var mockStream;
  var mockStreamingLogContents;
  var mockLaunchDebugContainer;
  var mockDebugContainer;
  var mockErrs;
  var element;
  var $elScope;

  function setup() {
    mockStreamingLogContents = {
      destroy: sinon.stub(),
      logs: [
        {
          imageId: 1,
          rawCommand: 'RUN echo one'
        },
        {
          imageId: 2,
          rawCommand: 'CMD two'
        }
      ]
    };
    mockStreamingLog = sinon.stub().returns(mockStreamingLogContents);

    mockPrimus = {
      createBuildStream: sinon.spy(function () {
        mockStream = new EventEmitter();
        sinon.spy(mockStream, 'on');
        return mockStream;
      }),
      createBuildStreamFromContextVersionId: sinon.spy(function () {
        mockStream = new EventEmitter();
        sinon.spy(mockStream, 'on');
        return mockStream;
      })
    };
    mockErrs = {
      handler: sinon.spy()
    };

    angular.mock.module('app', function ($provide) {
      $provide.value('streamingLog', mockStreamingLog);
      $provide.value('primus', mockPrimus);
      $provide.value('errs', mockErrs);
      $provide.factory('launchDebugContainer', function ($q) {
        mockLaunchDebugContainer = sinon.stub().returns($q.when(mockDebugContainer));
        return mockLaunchDebugContainer;
      });
    });
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _$q_,
      _$timeout_,
      _$compile_
    ) {
      $controller = _$controller_;
      $scope = _$rootScope_.$new();
      $rootScope = _$rootScope_;
      $q = _$q_;
      $timeout = _$timeout_;
      $compile = _$compile_;
    });

    $rootScope.featureFlags = {};
    $scope.instance = {
      id: sinon.stub().returns('instance ID'),
      attrs: {
        contextVersion: {
          _id: 'context version id'
        }
      },
      status: sinon.stub().returns('building')
    };

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
    it('should recalculate if the debug should show when the status changes to crashed', function () {
      $scope.instance.returns('crashed');
      $scope.$digest();

      var debugCmdChanged = sinon.spy();
      $scope.$on('debug-cmd-status', debugCmdChanged);
      mockStream.emit('end');
      $scope.$digest();

      sinon.assert.calledOnce(debugCmdChanged);
      sinon.assert.calledWith(debugCmdChanged, true);
    });
    it('should launch a debug container when clicked', function () {
      $scope.instance.returns('crashed');
      $scope.$digest();

      var debugCmdChanged = sinon.spy();
      $scope.$on('debug-cmd-status', debugCmdChanged);
      mockStream.emit('end');
      $scope.$digest();

      $elScope.debugCmd();

      sinon.assert.called(mockLaunchDebugContainer);
      sinon.assert.calledWith(mockLaunchDebugContainer, 'instance ID', 'context version id', 2, 'CMD two');

    });
  });
});
