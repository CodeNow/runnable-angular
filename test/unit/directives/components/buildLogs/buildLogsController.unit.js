'use strict';

var $controller;
var $scope;
var $rootScope;
var $q;
var $timeout;
var EventEmitter = require('events').EventEmitter;

describe('BuildLogsController'.bold.underline.blue, function () {

  var mockStreamingLog;
  var mockPrimus;
  var mockInstance;
  var mockStream;
  var mockStreamingLogContents;
  var BLC;
  var mockCreateDebugContainer;
  var mockDebugContainer;
  var mockErrs;

  function setup(useInstance, dontIncludeBuildDockerContainer) {
    mockInstance = {
      build: 'This is a test build!',
      status: sinon.stub().returns('building'),
      hasDockerfileMirroring: sinon.stub().returns(true),
      on: sinon.spy(),
      off: sinon.spy(),
      id: sinon.stub().returns('instanceID'),
      getContainerHostname: sinon.spy(),
      attrs: {
        contextVersion: {
          _id: 'ctxId',
          build: {
            dockerContainer: dontIncludeBuildDockerContainer ? undefined : 'asdsdfsd'
          }
        }
      }
    };
    mockDebugContainer = {
      id: sinon.stub().returns('debugContainerId'),
      attrs: {
        contextVersion: '12345',
        layerId: 'Layer ID'
      }
    };

    mockStreamingLogContents = {
      destroy: sinon.stub(),
      logs: []
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
      handler: sinon.spy(),
      report: sinon.spy()
    };

    angular.mock.module('app', function ($provide) {
      $provide.value('streamingLog', mockStreamingLog);
      $provide.value('primus', mockPrimus);
      $provide.value('errs', mockErrs);
      $provide.factory('createDebugContainer', function ($q) {
        mockCreateDebugContainer = sinon.stub().returns($q.when(mockDebugContainer));
        return mockCreateDebugContainer;
      });
    });
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _$q_,
      _$timeout_
    ) {
      $controller = _$controller_;
      $scope = _$rootScope_.$new();
      $rootScope = _$rootScope_;
      $q = _$q_;
      $timeout = _$timeout_;
    });

    var laterController = $controller('BuildLogsController', {
      $scope: $scope
    }, true);
    if (useInstance) {
      laterController.instance.instance = mockInstance;
    } else {
      laterController.instance.debugContainer = mockDebugContainer;
    }

    BLC = laterController();
    $scope.BLC = BLC;
  }
  describe('with an instance without a ready build', function () {
    beforeEach(function () {
      setup(true, true);
      $rootScope.$digest();
    });
    it('shouldn\'t create the build stream until the dockerContainer is populated', function () {
      sinon.assert.notCalled(mockPrimus.createBuildStream);

      sinon.assert.notCalled(mockStreamingLog);
      sinon.assert.notCalled(mockPrimus.createBuildStream);
      sinon.assert.notCalled(mockStreamingLog);
      BLC.instance.attrs.contextVersion.build.dockerContainer = 'asdasd';
      $rootScope.$digest();
      sinon.assert.calledWith(mockPrimus.createBuildStream, mockInstance.build);

      sinon.assert.calledOnce(mockStreamingLog);
      sinon.assert.calledOnce(mockPrimus.createBuildStream);
      sinon.assert.calledWith(mockStreamingLog, mockStream);
    });
  });
  describe('with an instance', function () {
    beforeEach(function () {
      setup(true);
      $rootScope.$digest();
    });
    it('should create the build stream and send it to streamingLog', function () {
      sinon.assert.calledWith(mockPrimus.createBuildStream, mockInstance.build);
      sinon.assert.calledOnce(mockStreamingLog);
      sinon.assert.calledOnce(mockPrimus.createBuildStream);
      sinon.assert.calledWith(mockStreamingLog, mockStream);
    });
    it('should handle destroy events', function () {
      $scope.$destroy();
      sinon.assert.calledOnce(mockStreamingLogContents.destroy);
    });
    it('should destroy the old stream, and create a new one', function () {
      sinon.assert.calledWith(mockPrimus.createBuildStream, mockInstance.build);
      sinon.assert.calledOnce(mockStreamingLog);
      sinon.assert.calledOnce(mockPrimus.createBuildStream);
      sinon.assert.calledWith(mockStreamingLog, mockStream);
      sinon.assert.calledOnce(BLC.instance.off);
      sinon.assert.calledOnce(BLC.instance.on);
      BLC.instance.off.reset();
      BLC.instance.on.reset();
      BLC.instance.attrs.contextVersion.build.dockerContainer = 'asd3e3rdfafads';
      $scope.$digest();
      sinon.assert.calledTwice(BLC.instance.off);
      sinon.assert.calledOnce(BLC.instance.on);
    });
    describe('handleUpdate', function () {
      it('should handle build logs running status', function () {
        mockInstance.on.lastCall.args[1]();
        expect(BLC.buildLogsRunning).to.be.ok;
        mockInstance.status.returns('started');
        mockInstance.on.lastCall.args[1]();
        expect(BLC.buildLogsRunning).to.not.be.ok;
      });
      it('should set error message', function () {
        var testErr = 'thatsDope';
        mockInstance.attrs.contextVersion.build.error = {
          message: testErr
        };
        mockInstance.status.returns('buildFailed');
        mockInstance.on.lastCall.args[1]();
        expect(BLC.failReason).to.equal(testErr);
        expect(BLC.buildStatus).to.equal('failed');
      });
      it('should set failed if no error message', function () {
        mockInstance.status.returns('buildFailed');
        mockInstance.on.lastCall.args[1]();
        expect(BLC.failReason).to.equal('failed');
        expect(BLC.buildStatus).to.equal('failed');
      });
      it('should handle toggling debug mode', function () {
        mockInstance.on.lastCall.args[1]();
        expect(BLC.showDebug).to.not.be.ok;
        mockInstance.status.returns('buildFailed');
        mockInstance.on.lastCall.args[1]();
        expect(BLC.showDebug).to.be.ok;
      });
    });
    describe('actions', function () {
      describe('launchDebugContainer', function () {
        it('should create a debug container', function () {
          var event = {
            stopPropagation: sinon.spy()
          };
          var command = {
            imageId: 12345
          };
          var newWindow = {
            location: ''
          };
          sinon.stub(window, 'open').returns(newWindow);
          expect(BLC.generatingDebug).to.not.be.ok;
          BLC.actions.launchDebugContainer(event, command);
          expect(BLC.generatingDebug).to.be.ok;
          $scope.$digest();
          expect(BLC.generatingDebug).to.not.be.ok;
          expect(newWindow.location).to.equal('/debug/' + mockDebugContainer.id());
          sinon.assert.calledOnce(mockCreateDebugContainer);
          sinon.assert.calledWith(mockCreateDebugContainer, mockInstance.id(), mockInstance.attrs.contextVersion._id, command.imageId);
          window.open.restore();
        });
        it('should do nothing if we are already a debug container', function () {
          var event = {
            stopPropagation: sinon.spy()
          };
          var command = {
            imageId: 12345
          };
          BLC.debugContainer = {};
          BLC.actions.launchDebugContainer(event, command);
          sinon.assert.notCalled(mockCreateDebugContainer);
        });
        it('should do nothing if we are already generating a debug container', function () {
          var event = {
            stopPropagation: sinon.spy()
          };
          var command = {
            imageId: 12345
          };
          BLC.generatingDebug = true;
          BLC.actions.launchDebugContainer(event, command);
          sinon.assert.notCalled(mockCreateDebugContainer);
        });
        it('should handle errors creating deubg containers', function () {
          var event = {
            stopPropagation: sinon.spy()
          };
          var command = {
            imageId: 12345
          };
          var newWindow = {
            location: '',
            close: sinon.stub()
          };
          mockCreateDebugContainer.returns($q.reject('REJECTION!'));
          sinon.stub(window, 'open').returns(newWindow);
          expect(BLC.generatingDebug, 'generatingDebug before').to.not.be.ok;
          BLC.actions.launchDebugContainer(event, command);
          expect(BLC.generatingDebug, 'generatingDebug before promise resolved').to.be.ok;
          $scope.$digest();
          expect(BLC.generatingDebug, 'generatingDebug after').to.not.be.ok;
          sinon.assert.calledOnce(mockCreateDebugContainer);
          sinon.assert.calledWith(mockCreateDebugContainer, mockInstance.id(), mockInstance.attrs.contextVersion._id, command.imageId);


          sinon.assert.calledOnce(mockErrs.handler);
          sinon.assert.calledWith(mockErrs.handler, 'REJECTION!');

          window.open.restore();
        });
      });
    });
    describe('on stream end', function () {
      it('should retry if there was no data sent then fail', function () {
        for (var i=0;i<16;i++) {
          mockStream.emit('end');
          $scope.$digest();
          $timeout.flush();
        }
        expect(BLC.streamFailure).to.be.ok;
        expect(BLC.buildLogsRunning).to.not.be.ok;
      });
      it('should finish if we had data', function () {
        mockStream.emit('data', {});
        mockStream.emit('end');
        $scope.$digest();
        expect(BLC.streamFailure).to.not.be.ok;
        expect(BLC.buildLogsRunning).to.not.be.ok;
      });
    });
    describe('on stream disconnect', function () {
      it('should reload everything', function () {
        sinon.assert.calledOnce(mockPrimus.createBuildStream);
        mockStream.emit('disconnection');
        $scope.$digest();
        sinon.assert.calledTwice(mockPrimus.createBuildStream);
      });
      it('should not create 2 streams accidentally', function () {
        sinon.assert.calledOnce(mockPrimus.createBuildStream);
        delete BLC.instance.attrs.contextVersion.build.dockerContainer;
        mockPrimus.createBuildStream.reset();
        mockStream.emit('disconnection');
        $scope.$digest();
        mockStream.emit('disconnection');
        $scope.$digest();
        BLC.instance.attrs.contextVersion.build.dockerContainer = 'asdasdasda';
        $scope.$digest();
        sinon.assert.calledOnce(mockPrimus.createBuildStream);
      });
    });
  });
  describe('with a debug container', function () {
    beforeEach(function () {
      setup();
    });
    describe('setupStream', function () {
      it('should createBuildStreamFromContextVersionId', function () {
        sinon.assert.calledOnce(mockPrimus.createBuildStreamFromContextVersionId);
        sinon.assert.calledWith(mockPrimus.createBuildStreamFromContextVersionId, mockDebugContainer.attrs.contextVersion);

        sinon.assert.calledOnce(mockStreamingLog);
        sinon.assert.calledWith(mockStreamingLog, mockStream);
      });
    });
    describe('getBuildLogs', function () {
      it('should filter the build logs to only show logs until the one we are debugging', function () {
        BLC.buildLogs = [
          {
            imageId: '1'
          },
          {
            imageId: '2'
          },
          {
            imageId: 'Layer ID'
          },
          {
            imageId: '3'
          }
        ];

        var newBuildLogs = BLC.getBuildLogs();
        expect(newBuildLogs.length).to.equal(3);
        var foundThird = newBuildLogs.find(function (log) {
          return log.imageId === '3';
        });
        expect(foundThird).to.not.be.ok;
      });
    });
  });
});
