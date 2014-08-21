require('app')
  .directive('tabs', tabs);
/**
 * tabs Directive
 * @ngInject
 */
function tabs(
  $state
) {
  return {
    restrict: 'E',
    templateUrl: 'viewTabs',
    replace: true,
    scope: {
      openItems: '='
    },
    link: function ($scope, element, attrs) {
      $scope.state = $state;
      var actions = $scope.actions = {};
      var data = $scope.data = {};
    }
  };
}
