'use strict';

require('app')
  .directive('composeCard', composeCard);

function composeCard(
  currentOrg
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
    }
  };
}
