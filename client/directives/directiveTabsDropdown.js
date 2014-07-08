require('app')
  .directive('tabsDropdown', factoryTabsDropdown);
/**
 * tabsDropdown Directive
 * @ngInject
 */
function factoryTabsDropdown (
  $timeout,
  user,
  holdUntilAuth,
  async
) {
  return {
    restrict: 'E',
    templateUrl: 'viewTabsDropdown',
    replace: true,
    scope: {},
    link: function ($scope, element, attrs) {

    }
  };
}
