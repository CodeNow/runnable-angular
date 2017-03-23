'use strict';

require('app')
  .directive('instanceCard', instanceCard);

function instanceCard(
  currentOrg
) {
  return {
    restrict: 'A',
    templateUrl: 'instanceCardView',
    scope: {
      instance: '='
    },
    link: function ($scope) {
      $scope.activeAccount = currentOrg.github.attrs.login;
    }
  };
}
