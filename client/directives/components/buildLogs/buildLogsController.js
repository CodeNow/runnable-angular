'use strict';

require('app').controller('BuildLogsController', BuildLogsController);

function BuildLogsController(
  streamingLog,
  $scope,
  primus,
  errs,
  createDebugContainer,
  $rootScope
) {
  var BLC = this;
  BLC.showDebug = false;

  var count = 0;

  function handleUpdate (instance) {
    var status = instance.status();
    if (status === 'buildFailed') {
      BLC.buildStatus = 'failed';
      BLC.showDebug = true;
      BLC.buildLogsRunning = false;
    } else if (status === 'building') {
      BLC.buildStatus = 'running';
      BLC.buildLogsRunning = true;
      BLC.showDebug = false;
    } else {
      BLC.buildStatus = 'success';
    }
  }

  function setupStream () {
    console.log('Stream start', new Date());
    var stream = null;
    if (BLC.instance) {
      stream = primus.createBuildStream(BLC.instance.build);
      BLC.streamStart = new Date();
      handleUpdate(BLC.instance);
      BLC.instance.on('update', handleUpdate);
      $scope.$on('$destroy', function () {
        BLC.instance.off('update', handleUpdate);
      });
    } else if (BLC.debugContainer) {
      stream = primus.createBuildStreamFromContextVersionId(BLC.debugContainer.attrs.contextVersion);
    }

    stream.on('end', function () {
      console.log('Stream ended.', new Date() - BLC.streamStart, new Date());
      console.log(BLC.instance.status());
      if (BLC.instance.status() === 'building') {
        count++;
        if (count > 5) {
          console.log('Max retries reached.');
          return;
        }
        console.log('Retry count', count);
        setupStream();
      }
      $scope.$applyAsync();
    });
    stream.on('disconnection', function () {
      console.log('Stream disconnected.', new Date() - BLC.streamStart, new Date());
      setupStream();
      $scope.$applyAsync();
    });
    var streamingBuildLogs = streamingLog(stream);
    $scope.$on('$destroy', function () {
      streamingBuildLogs.destroy();
    });
    BLC.buildLogs = streamingBuildLogs.logs;
  }

  setupStream();



  this.generatingDebug = false;


  this.actions = {
    launchDebugContainer: function (event, command) {
      if (BLC.debugContainer) {
        return;
      }

      $rootScope.$emit('close-popovers');

      if (BLC.generatingDebug) {
        return;
      }
      var topBar = window.outerHeight - window.innerHeight;
      var padding = 60;
      var width = window.innerWidth - padding - padding;
      var height = window.innerHeight - padding - padding - 50;
      var top = window.screenTop + padding + topBar;
      var left = window.screenLeft + padding;
      var newWindow = window.open('/loading', 'page', 'toolbar=0,scrollbars=1,location=0,statusbar=0,menubar=0,resizable=0,width='+width+',height='+height+',left='+left+',top='+top+',titlebar=yes');
      event.stopPropagation();
      BLC.generatingDebug = true;
      createDebugContainer(BLC.instance.id(), BLC.instance.attrs.contextVersion._id, command.imageId)
        .then(function (debugContainer) {
          command.generatingDebug = false;
          if (newWindow) {
            newWindow.window.container = debugContainer;
            newWindow.location = '/debug/'+debugContainer.id();
          }
        })
        .catch(function (err) {
          if(newWindow){
            newWindow.close();
          }
          BLC.generatingDebug = false;
          errs.handler(err);
        });
    }
  };
}


