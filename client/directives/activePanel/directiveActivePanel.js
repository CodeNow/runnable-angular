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
  keypather
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
      // Remove the logView if the container never started
      if ($scope.instance.status() === 'neverStarted') {
        $scope.openItems.models.forEach(function (model) {
          if (keypather.get(model, 'state.type') === 'LogView') {
            $scope.openItems.remove(model);
          }
        });
      }

      $scope.data = {};

      // allow iframe to load url
      $scope.$sce = $sce;
      $scope.useAutoUpdate = !!attrs.useAutoUpdate;

      $scope.startCommand = function () {
        var cmd = keypather.get($scope, 'instance.containers.models[0].attrs.inspect.Config.Cmd[2]');
        cmd = cmd || '';
        return cmd.replace('until grep -q ethwe /proc/net/dev; do sleep 1; done;', '');
      };

      $scope.showDebugCmd = false;
      $scope.$on('debug-cmd-status', function (evt, status) {
        $scope.showDebugCmd = status;
      });
    }
  };
}
