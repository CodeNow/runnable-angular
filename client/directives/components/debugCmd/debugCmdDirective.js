'use strict';

require('app')
  .directive('debugCmd', debugCmd);

function debugCmd(
  launchDebugContainer,
  primus,
  streamingLog
) {
  return {
    restrict: 'A',
    templateUrl: 'debugCmdView',
    scope: {
      instance: '='
    },
    link: function ($scope) {
      var lastBeforeCMD = null;

      $scope.$watch('instance.status()', function (newVal) {
        if (newVal === 'crashed') {
          var stream = primus.createBuildStream($scope.instance.build);
          var streamingBuildLogs = streamingLog(stream);
          stream.on('end', function () {
            var command = streamingBuildLogs.logs[streamingBuildLogs.logs.length - 2];
            if(command && command.imageId){
              lastBeforeCMD = command;
              $scope.$emit('debug-cmd-status', true);
            } else {
              $scope.$emit('debug-cmd-status', false);
            }
          });
        } else {
          $scope.$emit('debug-cmd-status', false);
          lastBeforeCMD = null;
        }
      });

      $scope.generatingDebug = false;
      $scope.actions = {
        debugCmd: function () {
          if ($scope.generatingDebug) {
            return;
          }
          $scope.generatingDebug = true;
          launchDebugContainer($scope.instance.id(), $scope.instance.attrs.contextVersion._id, lastBeforeCMD.imageId, lastBeforeCMD.rawCommand)
            .then(function () {
              $scope.generatingDebug = false;
            });
        }
      };
    }
  };
}
