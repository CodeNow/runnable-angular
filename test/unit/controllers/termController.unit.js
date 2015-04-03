'use strict';

var $controller,
    $rootScope,
    $scope,
    $window;
var keypather;
var apiMocks = require('../apiMocks/index');
var mockPrimus = new fixtures.MockPrimus();

describe('TermController'.bold.underline.blue, function () {
  var ctx = {};
  function setup() {

    angular.mock.module('app', function ($provide) {
      $provide.value('primus', mockPrimus);
    });
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _keypather_,
      _$window_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      keypather = _keypather_;
      $window = _$window_;
    });

    ctx.instance = {
      attrs: apiMocks.instances.runningWithContainers,
      containers: {
        models: [
          {
            attrs: apiMocks.instances.runningWithContainers[0].container
          }
        ]
      }
    };
    $controller('TermController', {
      '$scope': $scope
    });
  }
  describe('basics'.blue, function () {
    beforeEach(function () {
      setup();
    });
    it('should not set anything up without a valid instance on the scope', function () {
      var streamStartListener = sinon.spy();
      $scope.$on('STREAM_START', streamStartListener);
      $rootScope.$digest();
      expect($scope.showSpinnerOnStream).to.not.be.ok;
      expect($scope.createStream, 'createStream').to.be.ok;
      expect($scope.connectStreams, 'connectStreams').to.be.ok;
      expect($scope.termOpts, 'termOpts').to.be.ok;
      expect($scope.termOpts, 'termOpts').to.deep.equal({
        hideCursor: false,
        cursorBlink: true
      });
      sinon.assert.notCalled(streamStartListener);
    });
    it('should create the stream and eventstream when requested', function () {
      $scope.instance = ctx.instance;
      $rootScope.$digest();
      expect($scope.stream, 'stream').to.not.be.ok;
      expect($scope.eventStream, 'eventsStream').to.not.be.ok;
      expect($scope.createStream, 'createStream').to.be.ok;
      $scope.createStream();
      $rootScope.$digest();
      $scope.$digest();
      expect($scope.stream, 'stream').to.be.ok;
      expect($scope.eventStream, 'eventsStream').to.be.ok;
    });
    it('should connect the stream when requested', function () {
      $rootScope.$digest();
      var stream = mockPrimus.createLogStream();
      $scope.stream = stream;
      var term = mockPrimus.createBuildStream();
      sinon.stub(term, 'on');
      sinon.stub($scope.stream, 'on');
      expect($scope.connectStreams, 'connectStreams').to.be.ok;
      $scope.connectStreams(term);
      $rootScope.$digest();
      sinon.assert.calledOnce($scope.stream.on);
      sinon.assert.calledOnce(term.on);
    });
  });

  describe('watching the instance'.blue, function () {
    beforeEach(function () {
      setup();
    });
    it('should put the starting stuff on term', function () {
      var startSpy = sinon.spy();
      $scope.$on('STREAM_START', startSpy);
      var container = ctx.instance.containers.models[0];

      container.running = function () {
        return true;
      };
      $scope.instance = ctx.instance;
      $rootScope.$digest();

      sinon.assert.calledOnce(startSpy);
    });
  });
});
