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
    restrict: 'E',
    templateUrl: 'viewInstanceBoxName',
    replace: true,
    scope: {
      instance: '='
    },
    link: function ($scope, elem, attrs) {
      $scope.getInstanceClasses = getInstanceClasses;

      $scope.getInstanceAltTitle = getInstanceAltTitle;
    }
  };
}
