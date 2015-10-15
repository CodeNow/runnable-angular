'use strict';

require('app')
  .directive('containerStatusButton', containerStatusButton);
/**
 * @ngInject
 */
function containerStatusButton(
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
        var status = keypather.get($scope.CSBC, 'instance.status()');
        var statusMap = {
          starting: 'Starting container',
          stopping: 'Stopping Container',
          building: 'Building',
          stopped: 'Stopped',
          crashed: 'Crashed',
          running: 'Running',
          buildFailed: 'Build Failed',
          neverStarted: 'Never Started',
          unknown: 'Unknown'
        };
        return statusMap[status] || 'Unknown';
      };

      $scope.getClassForInstance = function () {
        var status = keypather.get($scope.CSBC, 'instance.status()');

        var classes = [];
        if (['running', 'stopped', 'building', 'starting', 'stopping', 'neverStarted', 'unknown'].includes(status)){
          classes.push('gray');
        } else if (['crashed', 'buildFailed'].includes(status)) {
          classes.push('red');
        }

        if (['building', 'starting', 'stopping'].includes(status)) {
          classes.push('in');
        }
        return classes;
      };
      $scope.isChanging = function () {
        var status = keypather.get($scope.CSBC, 'instance.status()');
        return ['starting', 'building', 'stopping'].includes(status);
      };
    }
  };
}
