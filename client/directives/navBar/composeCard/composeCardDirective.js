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
      composeRepo: '@',
      isChild: '=?'
    },
    link: function ($scope) {
      $scope.getCardName = function () {
        return $scope.CCC.composeRepo;
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
