'use strict';

require('app')
  .directive('instanceBoxName', instanceBoxName);
/**
 * @ngInject
 */
function instanceBoxName(
  async,
  getInstanceAltTitle,
  getInstanceClasses,
  QueryAssist,
  $rootScope,
  $stateParams,
  user
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
