require('app')
  .directive('runnableAddRepoPopover', RunnableAddRepoPopover);
/**
 * @ngInject
 */
function RunnableAddRepoPopover (
) {
  return {
    restrict: 'E',
    templateUrl: 'viewAddRepoPopover',
    replace: true,
    scope: {},
    link: function ($scope, elem, attrs) {
    }
  };
}
