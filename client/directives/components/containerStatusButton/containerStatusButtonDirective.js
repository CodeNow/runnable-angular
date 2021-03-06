'use strict';

require('app')
  .directive('containerStatusButton', containerStatusButton);

function containerStatusButton(
  $rootScope,
  keypather
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
      $scope.getStatusText = function () {
        if (keypather.get($scope.CSBC, 'instance.isMigrating()')) {
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

        var testingStatusMap = {
          building: 'Building',
          stopped: 'Tests Passed',
          crashed: 'Tests Failed',
          running: 'Tests Running'
        };

        if (keypather.get($scope.CSBC, 'instance.attrs.isTesting') && keypather.get($scope.CSBC, 'instance.getRepoName()') && testingStatusMap[status]) {
          return testingStatusMap[status];
        }
        return statusMap[status] || 'Unknown';
      };

      $scope.getClassForInstance = function () {
        var status = keypather.get($scope.CSBC, 'instance.status()');

        var classes = [];
        if (['running', 'stopped', 'building', 'starting', 'stopping', 'unknown'].includes(status)){
          classes.push('purple');
        } else if (['crashed', 'buildFailed', 'neverStarted'].includes(status)) {
          classes.push('red');
        }
        if ($rootScope.featureFlags.composeTestingUpdate) {
          classes.push('disabled');
        }
        return classes;
      };
      $scope.isChanging = function () {
        if (keypather.get($scope.CSBC, 'instance.isMigrating()')) {
          return true;
        }

        var status = keypather.get($scope.CSBC, 'instance.status()');
        return ['starting', 'stopping'].includes(status);
      };
    }
  };
}
