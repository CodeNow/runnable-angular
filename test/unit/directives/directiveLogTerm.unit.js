/*globals fixtures:true, modelStore:true, directiveTemplate:true */
'use strict';
// injector-provided
var $compile;
var $filter;
var $provide;
var $rootScope;
var $scope;
var $controllerScope = {};
var $state;
var $stateParams;
var $timeout;
var mockPrimus = new fixtures.MockPrimus();

function createMockStream() {
  var mockStream = new mockPrimus.createBuildStream();
  /// Add off method here, instead of at every line in this file
  mockStream.off = sinon.stub();
  sinon.stub(mockStream, 'write');
  return mockStream;
}

describe('directiveLogTerm'.bold.underline.blue, function () {
  var ctx;

  function injectSetupCompile() {
    ctx.termMock = {
      write: sinon.spy(),
      writeln: sinon.spy(),
      reset: sinon.spy(),
      startBlink: sinon.spy(),
      off: sinon.spy(),
      refresh: sinon.spy()
    };
    ctx.resizeHandlerCb = null;
    ctx.setupTermMock = sinon.spy(function (a, b, c, cb) {
      ctx.resizeHandlerCb = cb;
      return ctx.termMock;
    });
    angular.mock.module(function ($provide, $controllerProvider) {
      $provide.value('primus', mockPrimus);
      $provide.factory('fetchInstances', fixtures.mockFetchInstances.running);
      $provide.value('helperSetupTerminal', ctx.setupTermMock);
      $controllerProvider.register('TestController', function ($scope, primus, $timeout) {
        $scope.instance = {};
        $scope.createStream = sinon.stub();
        $scope.connectStreams = sinon.spy();
        $scope.streamEnded = sinon.stub();
        $scope.stream = createMockStream();
        $controllerScope = $scope;
      });
    });
    angular.mock.inject(function (
      _$compile_,
      _$filter_,
      _$rootScope_,
      _$state_,
      _$stateParams_,
      _$timeout_
    ) {
      $compile = _$compile_;
      $filter = _$filter_;
      $rootScope = _$rootScope_;
      $state = _$state_;
      $stateParams = _$stateParams_;
      $scope = _$rootScope_.$new();
      $timeout = _$timeout_;
    });

    modelStore.reset();

    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
  }

  beforeEach(function () {
    angular.mock.module('app');
    ctx = {};
    ctx.template = directiveTemplate.attribute('log-term', {
      controller: 'TestController'
    });
    injectSetupCompile();
  });

  describe('Test flow', function () {
    describe('1 stream', function () {
      it('should flow through', function () {
        sinon.assert.calledOnce(ctx.setupTermMock);
        $scope.$broadcast('STREAM_START', {}, true);
        $scope.$apply();
        sinon.assert.calledOnce(ctx.termMock.reset);
        sinon.assert.calledOnce($controllerScope.createStream);
        sinon.assert.calledOnce($controllerScope.connectStreams);
        sinon.assert.calledWith($controllerScope.connectStreams, ctx.termMock);
        $controllerScope.connectStreams.reset();

        sinon.assert.notCalled($controllerScope.streamEnded);
        mockPrimus.emit('open');
        $rootScope.$apply();
        // Shouldn't 'reconnect' unless it actually disconnected
        sinon.assert.neverCalledWith(ctx.termMock.writeln, '* Connection Regained — Thanks for your patience! *');

        mockPrimus.emit('offline');
        $rootScope.$apply();
        mockPrimus.emit('open');
        $rootScope.$apply();

        sinon.assert.calledWith(ctx.termMock.writeln, '* Connection Regained — Thanks for your patience! *');
        $controllerScope.stream.end();
        $rootScope.$apply();
      });
      it('should turn on the spinner, then turn it off', function () {
        $controllerScope.showSpinnerOnStream = true;
        $scope.$broadcast('STREAM_START', {}, true);
        $scope.$apply();
        sinon.assert.calledOnce(ctx.termMock.reset);
        sinon.assert.calledOnce($controllerScope.createStream);
        sinon.assert.calledWith($controllerScope.connectStreams, ctx.termMock);
        expect(ctx.termMock.cursorState, 'cursorState').to.equal(-1);
        expect(ctx.termMock.hideCursor, 'hideCursor').to.be.false;
        expect(ctx.termMock.cursorBlink, 'cursorBlink').to.be.true;
        expect(ctx.termMock.cursorSpinner, 'cursorSpinner').to.be.true;
        sinon.assert.calledOnce(ctx.termMock.startBlink);

        $controllerScope.connectStreams.reset();

        sinon.assert.notCalled($controllerScope.streamEnded);
        $controllerScope.stream.end();
        $rootScope.$apply();
        sinon.assert.calledOnce($controllerScope.streamEnded);
        expect(ctx.termMock.cursorState, 'cursorState').to.equal(0);
        expect(ctx.termMock.hideCursor, 'hideCursor').to.be.true;
        expect(ctx.termMock.cursorBlink, 'cursorBlink').to.be.false;
        expect(ctx.termMock.cursorSpinner, 'cursorSpinner').to.be.false;
      });
      describe('Term write', function () {
        it('should write to the term on event', function () {
          $scope.$broadcast('WRITE_TO_TERM', 'hello');
          $scope.$apply();
          sinon.assert.notCalled(ctx.termMock.reset);
          sinon.assert.calledWith(ctx.termMock.write, 'hello');
        });
        it('should reset the term when specified', function () {
          $scope.$broadcast('WRITE_TO_TERM', 'hello', true);
          $scope.$apply();
          sinon.assert.calledOnce(ctx.termMock.reset);
          sinon.assert.calledWith(ctx.termMock.write, 'hello');
        });
        it('should not write with a non string', function () {
          $scope.$broadcast('WRITE_TO_TERM', 123);
          $scope.$apply();
          sinon.assert.notCalled(ctx.termMock.reset);
          sinon.assert.notCalled(ctx.termMock.write);
        });
      });

    });
    describe('2 streams', function () {
      beforeEach(function () {
        $controllerScope.createStream.reset();
        $controllerScope.stream = createMockStream();
        $controllerScope.eventStream = createMockStream();
        $controllerScope.eventStream.stream = true;
      });
      it('should flow through', function () {
        sinon.assert.calledOnce(ctx.setupTermMock);
        $scope.$broadcast('STREAM_START');
        $scope.$apply();
        // Stream start calls this
        sinon.assert.calledOnce(ctx.termMock.off);
        ctx.termMock.off.reset();
        sinon.assert.notCalled(ctx.termMock.reset);
        sinon.assert.calledOnce($controllerScope.createStream);
        sinon.assert.calledOnce($controllerScope.connectStreams);
        sinon.assert.calledWith($controllerScope.connectStreams, ctx.termMock);
        $controllerScope.connectStreams.reset();
        ctx.resizeHandlerCb(2, 4);
        sinon.assert.calledOnce($controllerScope.eventStream.write, {
          event: 'resize',
          data: {
            x: 2,
            y: 4
          }
        });
        sinon.assert.notCalled(ctx.termMock.off);
        $controllerScope.stream.end();
        $rootScope.$apply();

        sinon.assert.calledOnce(ctx.termMock.off);
        sinon.assert.calledOnce($controllerScope.streamEnded);
        $scope.$destroy();
      });
    });
  });

  describe('destroy', function () {
    beforeEach(function () {
      $scope.stream = {}; // mock buildStream
    });
    it('should clean up buildStream', function () {
      var removeAllSpy = sinon.spy();
      var endSpy = sinon.spy();
      $controllerScope.stream.removeAllListeners = removeAllSpy;
      $controllerScope.stream.end = endSpy;
      $controllerScope.stream.off = sinon.spy();
      $scope.$destroy();
      expect(removeAllSpy.called).to.be.ok;
      expect(endSpy.called).to.be.ok;
      expect($controllerScope.stream.off.called).to.be.ok;
    });
  });

  describe('primus goes offline', function () {
    it('should display disconnect message when primus goes offline', function () {
      mockPrimus.emit('offline');
      $rootScope.$apply();
      sinon.assert.calledWith(ctx.termMock.writeln, '* Lost Connection — Retrying… *');
    });
  });
});
