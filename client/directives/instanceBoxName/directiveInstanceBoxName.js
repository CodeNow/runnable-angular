'use strict';

require('app')
  .directive('instanceBoxName', instanceBoxName);
/**
 * @ngInject
 */
function instanceBoxName(
  getInstanceAltTitle,
  getInstanceClasses
) {
  return {
    restrict: 'A',
    templateUrl: 'viewInstanceBoxName',
    scope: {
      instance: '='
    },
    link: function ($scope, elem, attrs) {
      $scope.getInstanceClasses = getInstanceClasses;

      $scope.getInstanceAltTitle = getInstanceAltTitle;
    }
  };
}
