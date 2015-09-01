'use strict';

require('app')
  .directive('activePanel', activePanel);
/**
 * activePanel Directive
 * @ngInject
 *
 * Attributes:
 *  backgroundButtons: Comma separated list of the tabs that can be allowed and added
 *
 */
function activePanel(
  $sce,
  keypather,
  launchDebugContainer,
  primus,
  streamingLog
) {
  return {
    restrict: 'A',
    templateUrl: 'viewActivePanel',
    scope: {
      openItems: '=',
      instance: '=',
      build: '=',
      validation: '=',
      stateModel: '=',
      isEditModal: '=?',
      debugContainer: '=?'
    },
    link: function ($scope, element, attrs) {
      $scope.data = {};

      // allow iframe to load url
      $scope.$sce = $sce;
      $scope.useAutoUpdate = !!attrs.useAutoUpdate;
      $scope.lastBeforeCMD = null;

      $scope.showDebugCmd = false;
      $scope.$watch('instance.status()', function (newVal) {
        if (newVal === 'crashed') {
          var stream = primus.createBuildStream($scope.instance.build);
          var streamingBuildLogs = streamingLog(stream);
          stream.on('end', function () {
            var command = streamingBuildLogs.logs[streamingBuildLogs.logs.length - 2];
            if(command && command.imageId){
              $scope.lastBeforeCMD = command;
              $scope.showDebugCmd = true;
            }
          });
        } else {
          $scope.showDebugCmd = false;
          $scope.lastBeforeCMD = null;
        }
      });

      $scope.generatingDebug = false;
      $scope.actions = {
        debugCmd: function () {
          if ($scope.generatingDebug) {
            return;
          }
          $scope.generatingDebug = true;
          launchDebugContainer($scope.instance.id(), $scope.instance.attrs.contextVersion._id, $scope.lastBeforeCMD.imageId, $scope.lastBeforeCMD.rawCommand)
            .then(function () {
              $scope.generatingDebug = false;
            });
        }
      };

      $scope.startCommand = function () {
        var cmd = keypather.get($scope, 'instance.containers.models[0].attrs.inspect.Config.Cmd[2]');
        cmd = cmd || '';
        return cmd.replace('until grep -q ethwe /proc/net/dev; do sleep 1; done;', '');
      };
    }
  };
}
