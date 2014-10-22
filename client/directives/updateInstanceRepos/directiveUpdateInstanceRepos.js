require('app')
  .directive('runnableUpdateInstanceRepos', RunnableUpdateInstanceRepos);
/**
 * @ngInject
 */
function RunnableUpdateInstanceRepos (
) {
  return {
    restrict: 'E',
    templateUrl: 'viewUpdateInstanceRepos',
    replace: true,
    scope: {},
    link: function ($scope, elem, attrs) {
    }
  };
}
