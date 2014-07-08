require('app')
  .directive('tabs', tabsFactory);
/**
 * tabs Directive
 * @ngInject
 */
function tabsFactory (
  $timeout,
  user,
  holdUntilAuth,
  async
) {
  return {
    restrict: 'E',
    templateUrl: 'viewTabs',
    replace: true,
    scope: {
    },
    link: function ($scope, element, attrs) {
    }
  };
}
