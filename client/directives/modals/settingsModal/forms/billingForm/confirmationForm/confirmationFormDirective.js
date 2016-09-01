'use strict';

require('app').directive('confirmationForm', confirmationForm);

function confirmationForm(
  currentOrg
) {
  return {
    restrict: 'A',
    templateUrl: 'confirmationForm',
    link: function ($scope) {
      $scope.currentOrg = currentOrg;
    }
  };
}
