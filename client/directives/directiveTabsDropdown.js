require('app')
  .directive('tabsDropdown', tabsDropdown);
/**
 * tabsDropdown Directive
 * @ngInject
 */
function tabsDropdown() {
  return {
    restrict: 'E',
    templateUrl: 'viewTabsDropdown',
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
