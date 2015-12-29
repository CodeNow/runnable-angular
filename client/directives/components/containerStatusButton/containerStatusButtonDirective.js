'use strict';

require('app')
  .directive('containerStatusButton', containerStatusButton);
/**
 * @ngInject
 */
function containerStatusButton(
  $rootScope,
  errs,
  keypather,
  promisify
) {
  return {
    restrict: 'A',
    replace: true,
    templateUrl: 'containerStatusButtonView',
    controller: 'ContainerStatusButtonController',
    controllerAs: 'CSBC',
    bindToController: true,
    scope: {
      instance: '='
    },
    link: function ($scope) {
      $scope.$watch('CSBC.instance.configStatusValid', function (configStatusValid) {
        if ($scope.CSBC.instance && configStatusValid === false) {
          // This will cause the valid flag to flip, recalling this watcher
          return promisify($scope.CSBC.instance, 'fetchParentConfigStatus')()
            .catch(errs.handler);
        }
      });

      $scope.getStatusText = function () {
        if (keypather.get($scope.CSBC, 'instance.contextVersion.attrs.dockRemoved')) {
          return 'Migrating';
        }
        var status = keypather.get($scope.CSBC, 'instance.status()');
        var statusMap = {
          starting: 'Starting',
          stopping: 'Stopping',
          building: 'Building',
          stopped: 'Stopped',
          crashed: 'Crashed',
          running: 'Running',
          buildFailed: 'Build Failed',
          neverStarted: ($rootScope.featureFlags.internalDebugging) ? 'Never Started' : 'Build Failed',
          unknown: 'Unknown'
        };
        return statusMap[status] || 'Unknown';
      };

      $scope.getClassForInstance = function () {
        var status = keypather.get($scope.CSBC, 'instance.status()');

        var classes = [];
        if (['running', 'stopped', 'building', 'starting', 'stopping', 'unknown'].includes(status)){
          classes.push('gray');
        } else if (['crashed', 'buildFailed', 'neverStarted'].includes(status)) {
          classes.push('red');
        }

        if (['building', 'starting', 'stopping'].includes(status)) {
          classes.push('in');
        }

        if (keypather.get($scope.CSBC, 'instance.contextVersion.attrs.dockRemoved')) {
          classes.push('in');
        }
        return classes;
      };
      $scope.isChanging = function () {
        if (keypather.get($scope.CSBC, 'instance.contextVersion.attrs.dockRemoved')) {
          return true;
        }

        var status = keypather.get($scope.CSBC, 'instance.status()');
        return ['starting', 'building', 'stopping'].includes(status);
      };
    }
  };
}
