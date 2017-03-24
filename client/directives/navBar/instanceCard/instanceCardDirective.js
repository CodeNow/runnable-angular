'use strict';

require('app')
  .directive('instanceCard', instanceCard);

function instanceCard(
  $rootScope,
  $state,
  currentOrg,
  getPathShortHash
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
        var isCurrentBaseInstance = $state.is('base.instances.instance', {
          userName: $scope.activeAccount,
          instanceName: $scope.instance.attrs.name
        });

        if (isCurrentBaseInstance) {
          $scope.isActive = true;
          return;
        }

        // Determine if the instance name matches our shorthash?
        if (getPathShortHash() === $scope.instance.attrs.shortHash) {
          $scope.isActive = true;
          return;
        }

        $scope.isActive = false;
      }

      $rootScope.$on('$stateChangeSuccess', function () {
        checkIfActive();
      });
      checkIfActive();
    }
  };
}
