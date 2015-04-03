'use strict';
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
var mockPrimus = new fixtures.MockPrimus();

function createMockStream() {
  var mockStream = new mockPrimus.createBuildStream();
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
      blur: sinon.spy()
    };
    ctx.resizeHandlerCb = null;
    ctx.setupTermMock = sinon.spy(function (a, b, c, cb) {
      ctx.resizeHandlerCb = cb;
      return ctx.termMock;
    });
    angular.mock.module(function ($provide) {
      $provide.value('primus', mockPrimus);
      $provide.factory('fetchInstances', fixtures.mockFetchInstances.running);
      $provide.value('helperSetupTerminal', ctx.setupTermMock);
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
  }

  beforeEach(angular.mock.module('app'));

  beforeEach(function () {
    ctx = {};
    ctx.template = directiveTemplate.attribute('log-term');
  });
  beforeEach(injectSetupCompile);


  describe('Test flow', function () {
    beforeEach(function () {
      $scope.connectStreams = sinon.spy();
      $scope.streamEnded = sinon.spy();
    });
    describe('1 stream', function () {
      beforeEach(function () {
        $scope.createStream = sinon.spy(function () {
          $scope.stream = createMockStream();
          $scope.stream.off = sinon.spy();
        });
      });
      it('should flow through', function () {
        sinon.assert.calledOnce(ctx.setupTermMock);
        $scope.$broadcast('STREAM_START', {}, true);
        $scope.$apply();
        sinon.assert.calledOnce(ctx.termMock.reset);
        sinon.assert.calledOnce($scope.createStream);
        sinon.assert.calledOnce($scope.connectStreams);
        sinon.assert.calledWith($scope.connectStreams, ctx.termMock);
        $scope.connectStreams.reset();

        sinon.assert.notCalled($scope.streamEnded);
        mockPrimus.emit('open');
        $rootScope.$apply();
        // Shouldn't 'reconnect' unless it actually disconnected
        sinon.assert.neverCalledWith(ctx.termMock.writeln, '★ Connection regained.  Thank you for your patience ★');

        mockPrimus.emit('reconnect');
        $rootScope.$apply();
        mockPrimus.emit('open');
        $rootScope.$apply();

        sinon.assert.calledWith(ctx.termMock.writeln, '★ Connection regained.  Thank you for your patience ★');
        $scope.stream.end();
        $rootScope.$apply();
        sinon.assert.calledOnce($scope.streamEnded);
      });
      it('should turn on the spinner, then turn it off', function () {
        $scope.showSpinnerOnStream = true;
        $scope.$broadcast('STREAM_START', {}, true);
        $scope.$apply();
        sinon.assert.calledOnce(ctx.termMock.reset);
        sinon.assert.calledOnce($scope.createStream);
        sinon.assert.calledWith($scope.connectStreams, ctx.termMock);
        expect(ctx.termMock.cursorState, 'cursorState').to.equal(-1);
        expect(ctx.termMock.hideCursor, 'hideCursor').to.be.false;
        expect(ctx.termMock.cursorBlink, 'cursorBlink').to.be.true;
        expect(ctx.termMock.cursorSpinner, 'cursorSpinner').to.be.true;
        sinon.assert.calledOnce(ctx.termMock.startBlink);

        $scope.connectStreams.reset();

        sinon.assert.notCalled($scope.streamEnded);
        $scope.stream.end();
        $rootScope.$apply();
        sinon.assert.calledOnce($scope.streamEnded);
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
        $scope.createStream = sinon.spy(function () {
          $scope.stream = createMockStream();
          $scope.stream.off = sinon.spy();
          $scope.eventStream = createMockStream();
          $scope.eventStream.off = sinon.spy();
        });
      });
      it('should flow through', function () {
        sinon.assert.calledOnce(ctx.setupTermMock);
        $scope.$broadcast('STREAM_START');
        $scope.$apply();
        // Stream start calls this
        sinon.assert.calledOnce(ctx.termMock.off);
        ctx.termMock.off.reset();
        sinon.assert.notCalled(ctx.termMock.reset);
        sinon.assert.calledOnce($scope.createStream);
        sinon.assert.calledOnce($scope.connectStreams);
        sinon.assert.calledWith($scope.connectStreams, ctx.termMock);
        $scope.connectStreams.reset();
        ctx.resizeHandlerCb(2, 4);
        sinon.assert.calledOnce($scope.eventStream.write, {
          event: 'resize',
          data: {
            x: 2,
            y: 4
          }
        });
        sinon.assert.notCalled(ctx.termMock.off);
        $scope.stream.end();
        $rootScope.$apply();

        sinon.assert.calledOnce(ctx.termMock.off);
        sinon.assert.calledOnce($scope.streamEnded);
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
      $scope.stream.removeAllListeners = removeAllSpy;
      $scope.stream.end = endSpy;
      $scope.stream.off = sinon.spy();
      $scope.$destroy();
      expect(removeAllSpy.called).to.be.ok;
      expect(endSpy.called).to.be.ok;
      expect($scope.stream.off.called).to.be.ok;
    });
  });

  describe('primus goes offline', function () {
    it('should display disconnect message when primus goes offline', function () {
      mockPrimus.emit('reconnect');
      $rootScope.$apply();
      sinon.assert.calledWith(ctx.termMock.writeln, '☹ LOST CONNECTION - RETRYING ☹');
    });
  });
});
