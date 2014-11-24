require('app')
  .directive('modalForkBox', modalForkBox);
/**
 * directive modalForkBox
 * @ngInject
 */
function modalForkBox(
) {
  return {
    restrict: 'E',
    templateUrl: 'viewModalForkBox',
    replace: true,
    scope: {
      data: '=',
      actions: '=',
      defaultActions: '='
    },
    link: function ($scope, element, attrs) {
      $scope.data.newForkName = $scope.data.instance.attrs.name + '-copy';
      $scope.data.forkDependencies = true;
    }
  };
}