'use strict';

require('app')
  .directive('instanceCard', instanceCard);

function instanceCard(
  currentOrg,
  $state
) {
  return {
    restrict: 'A',
    templateUrl: 'instanceCardView',
    scope: {
      instance: '='
    },
    link: function ($scope) {
      $scope.activeAccount = currentOrg.github.attrs.login;

      $scope.isActive = function () {
        var active = $state.is('base.instances.instance', {
          userName: $scope.activeAccount,
          instanceName: $scope.instance.attrs.name
        });
        if (active) {
          console.log('ACTIVE!');
        }
        return active;
      };
    }
  };
}
