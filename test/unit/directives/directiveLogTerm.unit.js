'use strict';

var sinon = require('sinon');
var pluck = require('101/pluck');
var find = require('101/find');

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
var apiMocks = require('../apiMocks/index');

function createMockStream() {
  var mockStream = new fixtures.MockStream();
  sinon.stub(mockStream, 'on');
  sinon.stub(mockStream, 'off');
  sinon.stub(mockStream, 'removeAllListeners');
  sinon.stub(mockStream, 'end');
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
      startBlink: sinon.spy()
    };
    ctx.setupTermMock = sinon.spy(function () {
      return ctx.termMock;
    });
    ctx.setupTermMock = sinon.spy();
    angular.mock.module(function ($provide) {
      $provide.value('primus', mockPrimus);
      $provide.factory('fetchInstances', fixtures.mockFetchInstances.running);
      $provide.factory('helperSetupTerminal', ctx.setupTermMock);
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
    ctx.template = directiveTemplate.attribute('log-build');

  });
  beforeEach(injectSetupCompile);

  it('basic dom', function () {
    var $el = ctx.element[0].querySelector('.terminal');
    expect($el).to.be.ok;
  });


  describe('Test flow', function () {
    beforeEach(function () {
      $scope.connectStreams = sinon.spy();
      $scope.streamEnded = sinon.spy();
    });
    describe('1 stream', function () {
      beforeEach(function () {
        $scope.createStream = sinon.spy(function () {
          $scope.stream = createMockStream();
        });
      });
      it('should flow through', function () {
        sinon.assert.calledOnce(ctx.setupTermMock);
        $scope.$broadcast('STREAM_START');
        $scope.$apply();
        sinon.assert.calledOnce(ctx.termMock.reset);
        sinon.assert.calledOnce(ctx.createStream);
        sinon.assert.calledOnce(ctx.connectStreams);
        sinon.assert.calledWith(ctx.connectStreams, ctx.termMock);
        ctx.connectStreams.reset();
        sinon.assert.notCalled($scope.stream.end);
        mockPrimus.emit('reconnect');
        $scope.$apply();
        sinon.assert.calledWith(ctx.connectStreams, ctx.termMock);
        $scope.stream.emit('end');
      })
    });
    describe('2 streams', function () {
      beforeEach(function () {
        $scope.createStream = sinon.spy(function () {
          $scope.stream = createMockStream();
          $scope.eventStream = createMockStream();
        });
        $scope.connectStreams = sinon.spy();
      });
      it('should flow through', function () {

      })
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
      $scope.$destroy();
      expect(removeAllSpy.called).to.be.ok;
      expect(endSpy.called).to.be.ok;
    });
  });

  describe('primus goes offline', function () {
    it('should display disconnect message when primus goes offline', function () {
      mockPrimus.emit('offline');
      var $el = ctx.element[0].querySelector('.terminal');
      expect($el).to.be.ok;
      expect($el.innerHTML).to.match(/LOST.*CONNECTION/);
    });
  });
});
