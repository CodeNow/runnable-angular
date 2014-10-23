require('app')
  .directive('runnableRepoActions', RunnableRepoActions);
/**
 * @ngInject
 */
function RunnableRepoActions (
) {
  return {
    restrict: 'E',
    templateUrl: 'viewRepoActions',
    replace: true,
    scope: {},
    link: function ($scope, elem, attrs) {
    }
  };
}
