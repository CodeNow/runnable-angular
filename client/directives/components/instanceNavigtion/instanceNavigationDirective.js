'use strict';

require('app').directive('instanceNavigation', instanceNavigation);

function instanceNavigation(
  $rootScope,
  $state,
  keypather,
  getInstanceServiceName
) {
  return {
    restrict: 'A',
    templateUrl: 'instanceNavigationView',
    controller: 'InstanceNavigationController',
    controllerAs: 'INC',
    bindToController: true,
    scope: {
      instance: '=',
      masterInstance: '=?'
    },
    link: function ($scope) {
      $scope.$state = $state;

      $scope.getNavigationName = function () {
        var instance = $scope.INC.instance;
        // This is a cluster!
        if (keypather.get(instance, 'attrs.inputClusterConfig._id') && $rootScope.featureFlags.composeNav) {
          return getInstanceServiceName(instance);
        }

        var branchName = instance.getBranchName();
        var preamble = '';
        if ($scope.INC.instance.attrs.isTesting && !$scope.INC.instance.attrs.masterPod) {
          preamble = $scope.INC.instance.getMasterPodName() + '/';
        } else if ($scope.INC.instance.attrs.masterPod && branchName) {
          preamble = $scope.INC.instance.attrs.name + '/';
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
