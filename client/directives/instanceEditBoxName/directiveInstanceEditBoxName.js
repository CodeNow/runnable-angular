'use strict';

require('app')
  .directive('instanceEditBoxName', instanceEditBoxName);
/**
 * @ngInject
 */
function instanceEditBoxName(
  getInstanceAltTitle,
  getInstanceClasses
) {
  return {
    restrict: 'E',
    templateUrl: 'viewInstanceEditBoxName',
    scope: {
      instance: '='
    },
    link: function ($scope, elem, attrs) {
      $scope.getInstanceClasses = getInstanceClasses;

      $scope.getInstanceAltTitle = getInstanceAltTitle;
    }
  };
}
