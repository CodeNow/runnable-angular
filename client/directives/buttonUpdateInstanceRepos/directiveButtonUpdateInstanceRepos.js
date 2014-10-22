require('app')
  .directive('runnableButtonUpdateInstanceRepos', RunnableButtonUpdateInstanceRepos);
/**
 * @ngInject
 */
function RunnableButtonUpdateInstanceRepos (
) {
  return {
    restrict: 'E',
    templateUrl: 'viewButtonUpdateInstanceRepos',
    replace: true,
    scope: {},
    link: function ($scope, elem, attrs) {
    }
  };
}
