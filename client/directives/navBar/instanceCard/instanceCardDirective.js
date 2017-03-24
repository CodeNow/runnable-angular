'use strict';

require('app')
  .directive('instanceCard', instanceCard);

function instanceCard(
  $rootScope,
  currentOrg,
  isInstanceActive
) {
  return {
    restrict: 'A',
    templateUrl: 'viewInstanceCard',
    scope: {
      instance: '='
    },
    link: function ($scope) {
      $scope.activeAccount = currentOrg.github.attrs.login;

      $scope.isActive = false;
      function checkIfActive() {
        $scope.isActive = isInstanceActive($scope.instance);
      }

      var stopListening = $rootScope.$on('$stateChangeSuccess', checkIfActive);
      $scope.$on('$destroy', stopListening);
      checkIfActive();
    }
  };
}
