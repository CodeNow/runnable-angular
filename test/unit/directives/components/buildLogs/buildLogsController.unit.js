'use strict';

var $controller;
var $scope;

describe('BuildLogsController'.bold.underline.blue, function () {

  var mockStreamingLog;
  var mockPrimus;
  var mockInstance;
  var mockStream;
  var mockStreamingLogContents;
  var BLC;
  function setup() {
    mockInstance = {
      build: 'This is a test build!',
      status: sinon.stub().returns('building'),
      on: sinon.spy(),
      off: sinon.spy()
    };

    mockStreamingLogContents = {
      destroy: sinon.stub(),
      logs: []
    };
    mockStreamingLog = sinon.stub().returns(mockStreamingLogContents);

    mockStream = {
      on: sinon.spy()
    };
    mockPrimus = { createBuildStream: sinon.stub().returns(mockStream) };

    angular.mock.module('app', function ($provide) {
      $provide.value('streamingLog', mockStreamingLog);
      $provide.value('primus', mockPrimus);
    });
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_
    ) {
      $controller = _$controller_;
      $scope = _$rootScope_.$new();
    });

    var laterController = $controller('BuildLogsController', {
      $scope: $scope
    }, true);
    laterController.instance.instance = mockInstance;
    BLC = laterController();
  }
  describe('basics'.blue, function () {
    beforeEach(function () {
      setup();
    });
    it('should create the build stream and send it to streamingLog', function () {
      sinon.assert.calledOnce(mockPrimus.createBuildStream);
      sinon.assert.calledWith(mockPrimus.createBuildStream, mockInstance.build);

      sinon.assert.calledOnce(mockStreamingLog);
      sinon.assert.calledWith(mockStreamingLog, mockStream);
    });
    it('should handle destroy events', function () {
      $scope.$destroy();
      sinon.assert.calledOnce(mockStreamingLogContents.destroy);
    });
    it('should handle build logs running status', function () {
      expect(BLC.buildLogsRunning).to.be.ok;
      mockInstance.status.returns('started');
      mockStream.on.lastCall.args[1]();
      expect(BLC.buildLogsRunning).to.not.be.ok;
    });
  });
});
