require('app')
  .directive('tabs', tabs);
/**
 * tabs Directive
 * @ngInject
 */
function tabs() {
  return {
    restrict: 'E',
    templateUrl: 'viewTabs',
    replace: true,
    scope: {
      openItems: '='
    },
    link: function ($scope, element, attrs) {
      var actions = $scope.actions = {};
      var data = $scope.data = {};
    }
  };
}
