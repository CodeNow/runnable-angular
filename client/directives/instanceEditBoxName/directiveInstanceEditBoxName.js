'use strict';

require('app')
  .directive('instanceEditBoxName', instanceEditBoxName);
/**
 * @ngInject
 */
function instanceEditBoxName(
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
