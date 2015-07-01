'use strict';

var $controller,
    $rootScope,
    $scope,
    $window;
var keypather;
var streamBuffers;
var apiMocks = require('../apiMocks/index');
var mockPrimus = new fixtures.MockPrimus();

describe('BoxLogController'.bold.underline.blue, function () {
  var ctx = {};

  function setup() {
    ctx = {};
    ctx.streamCleanserMock = sinon.spy(function () {
      return mockPrimus.createLogStream();
    });
    ctx.$log = {
      error: sinon.spy()
    };
    ctx.errs = {
      handler: sinon.spy()
    };
    angular.mock.module('app', function ($provide) {
      $provide.value('dockerStreamCleanser', ctx.streamCleanserMock);
      $provide.value('primus', mockPrimus);
      $provide.value('$log', ctx.$log);
      $provide.value('errs', ctx.errs);
    });
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _keypather_,
      _$window_,
      _streamBuffers_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      keypather = _keypather_;
      $window = _$window_;
      streamBuffers = _streamBuffers_;
      streamBuffers.ReadableStreamBuffer = function () {
        this.setEncoding = sinon.spy();
        this.put = sinon.spy();
        this.pipe = sinon.spy();
        this.destroySoon = sinon.spy();
        this.on = sinon.spy(function (action, cb) {
          cb();
        });
        this.destroy = sinon.spy();
        ctx.streamBuffer = this;
      };
    });
    var container = apiMocks.instances.runningWithContainers[0].container;

    ctx.instance = {
      attrs: apiMocks.instances.runningWithContainers,
      containers: {
        models: [
          {
            attrs: container
          }
        ]
      }
    };
    var ca = $controller('BoxLogController', {
      '$scope': $scope
    });
  }
  describe('basics'.blue, function () {
    beforeEach(function () {
      setup();
    });
    it('should not set anything up without a valid instance on the scope', function () {
      $rootScope.$digest();
      expect($scope.showSpinnerOnStream).to.not.be.ok;
      expect($scope.createStream, 'createStream').to.be.ok;
      expect($scope.connectStreams, 'connectStreams').to.be.ok;
      expect($scope.streamEnded, 'streamEnded').to.be.ok;
    });
    it('should create the stream when requested', function () {
      $rootScope.$digest();
      expect($scope.stream).to.not.be.ok;
      expect($scope.createStream, 'createStream').to.be.ok;
      $scope.createStream();
      expect($scope.stream).to.be.ok;
    });
    it('should connect the stream when requested', function () {
      $rootScope.$digest();
      var stream = mockPrimus.createLogStream();
      $scope.stream = stream;
      var term = mockPrimus.createBuildStream();
      expect($scope.connectStreams, 'connectStreams').to.be.ok;
      $scope.connectStreams(term);
      sinon.assert.calledWith(ctx.streamCleanserMock, 'hex');
      sinon.assert.calledWith(ctx.streamBuffer.setEncoding, 'utf8');
      sinon.assert.calledOnce(ctx.streamBuffer.pipe);
    });
    it('should receive data in stream buffer', function () {
      $rootScope.$digest();
      var stream = mockPrimus.createLogStream();
      $scope.stream = stream;
      var term = mockPrimus.createBuildStream();
      expect($scope.connectStreams, 'connectStreams').to.be.ok;
      $scope.connectStreams(term);
      $rootScope.$digest();
      sinon.assert.calledWith(ctx.streamCleanserMock, 'hex');
      sinon.assert.calledOnce(ctx.streamBuffer.pipe);
      sinon.assert.calledWith(ctx.streamBuffer.setEncoding, 'utf8');
      stream.write('Hello');
      $rootScope.$digest();
      sinon.assert.calledWith(ctx.streamBuffer.put, 'Hello');
    });
    it('should end the stream, and fetch, and post the exit code on the term', function (done) {
      $scope.instance = ctx.instance;
      $rootScope.$digest();

      var term = mockPrimus.createBuildStream();
      var stream = mockPrimus.createLogStream();
      $scope.stream = stream;
      expect($scope.connectStreams, 'connectStreams').to.be.ok;
      $scope.connectStreams(term);
      $scope.$on('WRITE_TO_TERM', function (event, message) {
        expect(message, 'message').to.equal('Exited with code: 5');
        done();
      });
      var container = $scope.instance.containers.models[0];
      container.attrs.inspect.State.ExitCode = 5;

      container.running = function () {
        return false;
      };

      expect($scope.streamEnded, 'streamEnded').to.be.ok;
      $scope.streamEnded();
      $scope.$apply();
      $rootScope.$destroy();
    });
  });

  describe('watching the instance'.blue, function () {
    beforeEach(function () {
      setup();
    });
    it('should put the starting stuff on term', function () {
      var writeSpy = sinon.spy();
      var startSpy = sinon.spy();
      $scope.$on('WRITE_TO_TERM', writeSpy);
      $scope.$on('STREAM_START', startSpy);
      var container = ctx.instance.containers.models[0];
      container.attrs.inspect.Config.Hostname = 'HostName';
      container.attrs.inspect.Config.Cmd = ['hello', 'everybody'];
      container.attrs.dockerContainer = true;

      container.running = function () {
        return true;
      };
      $scope.instance = ctx.instance;
      $rootScope.$digest();

      sinon.assert.calledOnce(writeSpy);
      sinon.assert.calledOnce(startSpy);
    });
    it('should put the error message on the term', function (done) {
      var startSpy = sinon.spy();
      $scope.$on('WRITE_TO_TERM', function (event, message) {
        expect(message, 'message').to.equal('\x1b[33;1m' + 'new error' + '\x1b[0m');
        done();
      });
      $scope.$on('STREAM_START', startSpy);
      var container = ctx.instance.containers.models[0];
      container.attrs.error = {
        message: 'new error'
      };
      container.running = function () {
        return false;
      };
      container.attrs.dockerContainer = false;
      $scope.instance = ctx.instance;
      $rootScope.$digest();

      sinon.assert.notCalled(startSpy);
    });
  });
});
