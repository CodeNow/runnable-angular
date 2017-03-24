'use strict';

require('app')
  .directive('composeCard', composeCard);

function composeCard(
  $rootScope,
  $state,
  currentOrg,
  getPathShortHash,
  keypather
) {
  return {
    restrict: 'A',
    templateUrl: 'viewComposeCard',
    scope: {
      composeCluster: '=',
      isChild: '=?'
    },
    link: function ($scope) {
      $scope.activeAccount = currentOrg.github.attrs.login;

      $scope.getCardName = function () {
        if ($scope.isChild) {
          return $scope.composeCluster.master.getBranchName();
        }
        var preamble = keypather.get($scope, 'composeCluster.master.attrs.inputClusterConfig.clusterName');
        if (preamble) {
          preamble = preamble + '/';
        }
        return preamble + $scope.composeCluster.master.getBranchName();
      };

      $scope.isActive = false;
      function checkIfActive() {
        if (!$scope.isChild) {
          $scope.isActive = true;
          return;
        }
        var isCurrentBaseInstance = $state.is('base.instances.instance', {
          userName: $scope.activeAccount,
          instanceName: $scope.composeCluster.master.attrs.name
        });

        if (isCurrentBaseInstance) {
          $scope.isActive = true;
          return;
        }

        // Determine if the instance name matches our shorthash?
        if (getPathShortHash() === $scope.composeCluster.master.attrs.shortHash) {
          $scope.isActive = true;
          return;
        }

        $scope.isActive = false;
      }

      $rootScope.$on('$stateChangeSuccess', function () {
        checkIfActive();
      });
      checkIfActive();

      $scope.getStagingInstances = function () {
        if ($scope.isChild) {
          return keypather.get($scope.composeCluster.master, 'isolation.instances.models');
        }
        return $scope.composeCluster.staging;
      };

      $scope.getTestingInstances = function () {
        if ($scope.isChild) {
          if ($scope.composeCluster.master.attrs.isTesting) {
            return keypather.get($scope.composeCluster.master, 'isolation.instances.models');
          }
          return keypather.get($scope.composeCluster, 'testing[0].isolation.instances.models');
        }
        return $scope.composeCluster.testing;
      };
    }
  };
}
