'use strict';

require('app').controller('BuildLogsController', BuildLogsController);

function BuildLogsController(
  $scope,
  $rootScope,
  $timeout,
  errs,
  launchDebugContainer,
  loading,
  updateInstanceWithNewBuild,
  primus,
  promisify,
  streamingLog
) {
  var BLC = this;
  BLC.showDebug = false;
  BLC.headerContent = [];

  function handleUpdate () {
    var status = BLC.instance.status();
    BLC.showErrorPanel = false;
    if (status === 'buildFailed' || status === 'neverStarted') {
      var buildError = BLC.instance.attrs.contextVersion.build.error || {};
      BLC.buildStatus = 'failed';
      BLC.failReason = buildError.message || 'failed';
      BLC.showDebug = true;
      BLC.buildLogsRunning = false;
      BLC.showNoDockerfileError = (BLC.instance.hasDockerfileMirroring() && BLC.instance.mirroredDockerfile === null);
      if (status === 'neverStarted') {
        BLC.showErrorPanel = true;
      }
    } else if (status === 'building') {
      BLC.buildStatus = 'running';
      BLC.buildLogsRunning = true;
      BLC.showDebug = false;
    } else {
      BLC.buildStatus = 'success';
      BLC.buildLogsRunning = false;
    }
  }

  var failCount = 0;
  var streamDelay = 500;

  function closeStream(stream) {
    if (stream && stream.end) {
      stream.end();
    }
    if (BLC.instance) {
      BLC.instance.off('update', handleUpdate);
    }
    BLC.buildLogsRunning = false;
  }
  var unWatchDockerContainer = angular.noop;
  function setupStream(oldStream) {
    if (oldStream) {
      closeStream(oldStream);
    }
    BLC.streamFailure = false;
    var stream = null;
    if (BLC.instance) {
      BLC.buildStatus = 'starting';
      BLC.buildLogs = [];
      BLC.buildLogTiming = {};
      unWatchDockerContainer();
      unWatchDockerContainer = $scope.$watch(
        'BLC.instance.attrs.contextVersion.build.dockerContainer',
        function (cvContainerId, oldCvContainerId) {
          if (cvContainerId && cvContainerId !== oldCvContainerId) {
            // When the build changes
            setupStream(stream);
          } else if (cvContainerId) {
            // This happens the first time
            stream = primus.createBuildStream(BLC.instance.build);
            // first time running
            BLC.instance.off('update', handleUpdate);
            BLC.instance.on('update', handleUpdate);
            connectListenersToStream(stream);
            handleUpdate();
          }
        }
      );
    } else if (BLC.debugContainer) {
      stream = primus.createBuildStreamFromContextVersionId(BLC.debugContainer.attrs.contextVersion);
      connectListenersToStream(stream);
    }
  }
  function connectListenersToStream(stream) {
    var streamingBuildLogs = null;
    $scope.$on('$destroy', function () {
      streamingBuildLogs.destroy();
      closeStream(stream);
    });
    stream.on('data', function (data) {
      if (data.type === 'log' && BLC.buildLogs.length === 0) {
        BLC.headerContent.push(data.content);
      }
      stream.hasData = true;
    });
    stream.on('end', function () {
      if (!stream.hasData) {
        failCount += 1;
        if (failCount > 10) {
          BLC.headerContent = [ ];
          BLC.streamFailure = true;
          BLC.buildLogsRunning = false;
        } else {
          streamDelay = Math.floor(streamDelay * 1.3);
          $timeout(function () {
            setupStream(stream);
          }, streamDelay);
        }
      } else {
        BLC.buildLogsRunning = false;
      }
      $scope.$applyAsync();
    });
    stream.on('disconnection', function () {
      setupStream();
      $scope.$applyAsync();
    });
    streamingBuildLogs = streamingLog(stream);
    BLC.buildLogs = streamingBuildLogs.logs;
    BLC.buildLogTiming = streamingBuildLogs.times;
    BLC.getRawLogs = streamingBuildLogs.getRawLogs;
  }

  BLC.getBuildLogs = function () {
    if (BLC.instance) {
      return BLC.buildLogs;
    }
    if (BLC.debugContainer) {
      var newBuildLogs = [];
      for (var i=0; i<BLC.buildLogs.length; i++) {
        var command = BLC.buildLogs[i];
        newBuildLogs.push(command);
        if (command.imageId === BLC.debugContainer.attrs.layerId) {
          return newBuildLogs;
        }
      }
      return newBuildLogs;
    }
  };

  setupStream();

  this.generatingDebug = false;
  this.actions = {
    rebuildWithoutCache: function () {
      loading('buildLogsController', true);
      promisify(BLC.instance.build, 'deepCopy')()
        .then(function (build) {
          return updateInstanceWithNewBuild(
            BLC.instance,
            build,
            true
          );
        })
        .catch(errs.handler)
        .finally(function () {
           loading('buildLogsController', false);
        });
    },
    launchDebugContainer: function (event, command) {
      if (BLC.debugContainer) {
        return;
      }
      $rootScope.$emit('close-popovers');
      if (BLC.generatingDebug) {
        return;
      }

      BLC.generatingDebug = true;
      launchDebugContainer(BLC.instance.id(), BLC.instance.attrs.contextVersion._id, command.imageId, command.rawCommand)
        .then(function () {
          BLC.generatingDebug = false;
        });
    }
  };
}


