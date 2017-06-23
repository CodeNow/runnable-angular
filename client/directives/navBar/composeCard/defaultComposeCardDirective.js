'use strict';

require('app')
  .directive('defaultComposeCard', defaultComposeCard);

function defaultComposeCard(
  $rootScope,
  keypather
) {
  return {
    restrict: 'A',
    templateUrl: 'viewDefaultComposeCard',
    controller: 'ComposeCardController',
    controllerAs: 'CCC',
    bindToController: true,
    scope: {
      composeCluster: '=',
      composeRepo: '@',
      isChild: '=?'
    },
    link: function ($scope) {
      $scope.getCardName = function () {
        return $scope.CCC.composeRepo || $scope.CCC.composeCluster.master.getBranchName();
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
