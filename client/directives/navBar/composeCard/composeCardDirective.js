'use strict';

require('app')
  .directive('composeCard', composeCard);

function composeCard(
  currentOrg,
  $state
) {
  return {
    restrict: 'A',
    templateUrl: 'composeCardView',
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
        return $scope.composeCluster.master.attrs.inputClusterConfig.clusterName;
      };

      $scope.isActive = function () {
        return !$scope.isChild && $state.is('base.instances.instance', {
          userName: $scope.activeAccount,
          instanceName: $scope.composeCluster.master.attrs.name
        });
      };
    }
  };
}
