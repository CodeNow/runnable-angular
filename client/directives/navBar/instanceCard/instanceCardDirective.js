'use strict';

require('app')
  .directive('instanceCard', instanceCard);

function instanceCard(
  $rootScope,
  $state,
  currentOrg,
  keypather
) {
  return {
    restrict: 'A',
    templateUrl: 'instanceCardView',
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
        if (keypather.get($state, 'params.instanceName.split(\'--\')[0]') === $scope.instance.attrs.shortHash) {
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
