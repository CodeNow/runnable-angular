'use strict';

require('app')
  .directive('composeCard', composeCard);

function composeCard(
  $rootScope,
  keypather
) {
  return {
    restrict: 'A',
    templateUrl: 'viewComposeCard',
    controller: 'ComposeCardController',
    controllerAs: 'CCC',
    bindToController: true,
    scope: {
      composeCluster: '=',
      isChild: '=?'
    },
    link: function ($scope) {
      $scope.getCardName = function () {
        if ($scope.CCC.isChild) {
          return $scope.CCC.composeCluster.master.getBranchName();
        }
        var preamble = keypather.get($scope.CCC, 'composeCluster.master.attrs.inputClusterConfig.clusterName');
        if (preamble) {
          preamble = preamble + '/';
        }
        return preamble + $scope.CCC.composeCluster.master.getBranchName();
      };

      $scope.isActive = false;
      var stopListening = $rootScope.$on('$stateChangeSuccess', function () {
        $scope.CCC.checkIfActive();
      });
      $scope.$on('$destroy', stopListening);
      $scope.CCC.checkIfActive();
    }
  };
}
