'use strict';

require('app')
  .directive('instanceAnonSecondaryActions', instanceAnonSecondaryActions);

function instanceAnonSecondaryActions() {
  return {
    templateUrl: 'viewInstanceAnonSecondaryActions',
    replace: true,
    restrict: 'E',
    link: function ($scope, elem, attrs) {
      $scope.data = {
        triggeredBy: 'edit'
      };
    }
  };
}