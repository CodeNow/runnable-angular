'use strict';

require('app')
  .directive('showDemoModal', showDemoModal);

function showDemoModal () {
  return {
    restrict: 'E',
    templateUrl: 'viewShowDemoModal',
    link: function($scope) {
      $scope.data = {
        triggeredBy: 'addRepo'
      };
    }
  };
}