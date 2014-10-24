require('app')
  .directive('runnableEditRepoCommit', RunnableEditRepoCommit);
/**
 * @ngInject
 */
function RunnableEditRepoCommit (
) {
  return {
    restrict: 'E',
    templateUrl: 'viewEditRepoCommit',
    replace: true,
    scope: {
      acv: '=appCodeVersion'
    },
    link: function ($scope, elem, attrs) {
    }
  };
}
