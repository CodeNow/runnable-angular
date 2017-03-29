'use strict';

require('app')
  .directive('composeCard', composeCard);

function composeCard(
  $rootScope,
  keypather,
  isInstanceActive
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
      function checkIfActive() {
        if (!$scope.CCC.isChild) {
          $scope.isActive = true;
          return;
        }
        $scope.isActive = isInstanceActive($scope.CCC.composeCluster.master);
      }

      var stopListening = $rootScope.$on('$stateChangeSuccess', function () {
        checkIfActive();
      });
      $scope.$on('$destroy', stopListening);
      checkIfActive();
    }
  };
}
