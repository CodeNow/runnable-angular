'use strict';

require('app').controller('BuildLogsController', BuildLogsController);

function BuildLogsController(
  streamingLog,
  $scope,
  primus,
  errs,
  createDebugContainer
) {
  var BLC = this;
  BLC.showDebug = false;

  function handleUpdate (instance) {
    var status = instance.status();
    if (status === 'buildFailed') {
      BLC.showDebug = true;
    } else if (status === 'building') {
      BLC.buildLogsRunning = true;
    }
  }

  var stream = null;
  if (this.instance) {
    BLC.buildLogsRunning = true;
    stream = primus.createBuildStream(this.instance.build);
    handleUpdate(this.instance);
    this.instance.on('update', handleUpdate);
    $scope.$on('$destroy', function () {
      BLC.instance.off('update', handleUpdate);
    });
  } else if (this.debugContainer) {
    stream = primus.createBuildStreamFromContextVersionId(this.debugContainer.attrs.contextVersion);
  }

  stream.on('end', function () {
    console.log('Stream end!?');
    BLC.buildLogsRunning = false;
  });
  var streamingBuildLogs = streamingLog(stream);
  $scope.$on('$destroy', function () {
    streamingBuildLogs.destroy();
  });
  this.buildLogs = streamingBuildLogs.logs;

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


