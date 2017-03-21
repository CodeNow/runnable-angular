'use strict';

require('app').directive('instanceNavigation', instanceNavigation);

function instanceNavigation(
  $state
) {
  return {
    restrict: 'A',
    templateUrl: 'instanceNavigationView',
    controller: 'InstanceNavigationController',
    controllerAs: 'INC',
    bindToController: true,
    scope: {
      instance: '=',
      activeAccount: '=',
      masterInstance: '=?'
    },
    link: function ($scope) {
      $scope.$state = $state;

      $scope.getNavigationName = function () {
        var instance = $scope.INC.instance;
        var branchName = instance.getBranchName();

        var preamble = '';
        if ($scope.INC.instance.attrs.isTesting && !$scope.INC.instance.attrs.masterPod) {
          preamble = $scope.INC.instance.getMasterPodName() + '/';
        }

        if (instance.attrs.isolated && !instance.attrs.isIsolationGroupMaster) {
          // If it's isolated and not the master we should first try to show the repo and branch name
          if (branchName) {
            return preamble + instance.getMasterPodName();
          }
          // If this is a non-repo container just show the name
          return preamble + instance.getName();
        }
        // If we have a branch show that
        if (branchName) {
          return preamble + branchName;
        }
        // This must be a non-repo container. Show the name.
        return preamble + instance.getName();
      };
    }
  };
}
