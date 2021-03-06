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
      composeRepo: '@?'
    },
    link: function ($scope) {
      $scope.getCardName = function () {
        if ($scope.CCC.composeRepo) {
          return $scope.CCC.composeRepo;
        }
        return $scope.CCC.composeCluster.displayName || $scope.CCC.composeCluster.master.getBranchName();
      };

      $scope.showDeleteButton = function () {
        return keypather.get($scope, 'CCC.composeCluster.master.attrs.masterPod') === false;
      };

      $scope.isActive = true;
      var stopListening = $rootScope.$on('$stateChangeSuccess', function () {
        $scope.CCC.checkIfActive();
      });
      $scope.$on('$destroy', stopListening);
      $scope.CCC.checkIfActive();
    }
  };
}
