require('app')
  .directive('popOver', popOver);
/**
 * popOver Directive
 * @ngInject
 */
function popOver() {
  return {
    restrict: 'E',
    templateUrl: function ($element, attrs) {
      return attrs.template;
    },
    replace: true,
    scope: {
      data: '=',
      actions: '&'
    },
    link: function ($scope, element, attrs) {
      $scope.actions = $scope.actions();
    }
  };
}
