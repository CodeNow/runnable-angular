'use strict';

var $controller,
    $rootScope,
    $scope,
    $window;
var keypather;
var apiMocks = require('../apiMocks/index');
var streamBuffers;
var mockPrimus = new fixtures.MockPrimus();

function createCv() {
  return {
    attrs: apiMocks.contextVersions.running,
    fetch: sinon.spy(function (cb) {
      cb(null, this);
    })
  };
}
describe('BuildLogController'.bold.underline.blue, function () {
  var ctx = {};
  function setup() {
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
        this.destroy = sinon.spy();
        ctx.streamBuffer = this;
      };
    });

    ctx.buildPassed = true;
    ctx.build = {
      attrs: apiMocks.builds.built,
      succeeded: sinon.spy(function () {
        return ctx.buildPassed === true;
      }),
      failed: sinon.spy(function () {
        return ctx.buildPassed === false;
      }),
      contextVersions: {
        models: [
          createCv()
        ]
      }
    };
    var ca = $controller('BuildLogController', {
      '$scope': $scope
    });
  }
  describe('basics'.blue, function () {
    beforeEach(function () {
      setup();
    });
    it('should not set anything up without a valid build on the scope', function () {
      $rootScope.$digest();
      expect($scope.showSpinnerOnStream).to.be.true;
      expect($scope.createStream, 'createStream').to.be.ok;
      expect($scope.connectStreams, 'connectStreams').to.be.ok;
      sinon.assert.notCalled(ctx.build.failed);
      sinon.assert.notCalled(ctx.build.succeeded);
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
      var stream = mockPrimus.createBuildStream();
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
      var stream = mockPrimus.createBuildStream();
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
  });

  describe('watching the build'.blue, function () {
    beforeEach(function () {
      setup();
    });
    it('should put the log on the term', function (done) {
      var cv = ctx.build.contextVersions.models[0];
      $scope.$on('WRITE_TO_TERM', function (event, message, clear) {
        expect(clear, 'clear').to.be.true;
        expect(message, 'message').to.equal(cv.attrs.build.log);
        done();
      });

      ctx.buildPassed = true;
      $scope.build = ctx.build;
      $rootScope.$digest();

      sinon.assert.calledOnce(cv.fetch);

    });
    it('should put the error message on the term', function (done) {
      var cv = ctx.build.contextVersions.models[0];
      cv.attrs.build.error = {
        message: 'ERROR'
      };
      $scope.$on('WRITE_TO_TERM', function (event, message, clear) {
        expect(clear, 'clear').to.be.true;
        expect(message, 'message').to.equal(cv.attrs.build.log);
        done();
      });
      ctx.buildPassed = false;
      $scope.build = ctx.build;
      $rootScope.$digest();

      sinon.assert.calledOnce(cv.fetch);

    });

    it('should catch the error on cv fetch', function () {
      var cv = ctx.build.contextVersions.models[0];
      var error = new Error('safsdfadsf');
      cv.fetch = sinon.spy(function (cb) {
        cb(error);
      });
      ctx.buildPassed = false;
      $scope.build = ctx.build;
      $rootScope.$digest();

      sinon.assert.calledOnce(cv.fetch);
      sinon.assert.calledOnce(ctx.errs.handler);

    });

    it('should try to start the stream when it needs to', function (done) {
      var cv = ctx.build.contextVersions.models[0];
      $scope.$on('STREAM_START', function (event, build) {
        expect(build, 'build').to.equal(ctx.build);
        done();
      });
      ctx.buildPassed = null;
      $scope.build = ctx.build;
      $rootScope.$digest();

    });
  });
});
