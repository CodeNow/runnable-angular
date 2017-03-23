'use strict';

require('app')
  .directive('composeCard', composeCard);

function composeCard(
  currentOrg
) {
  return {
    restrict: 'A',
    templateUrl: 'composeCardView',
    scope: {
      composeCluster: '='
    },
    link: function ($scope) {
      $scope.activeAccount = currentOrg.github.attrs.login;
    }
  };
}
