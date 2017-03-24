'use strict';

require('app')
  .directive('branchTestSelector', branchTestSelector);

/*
 * This directive requires the following values to be on data:
 *  branch,
 *  commit,
 *  latestCommit,
 */
function branchTestSelector(
  errs,
  promisify
) {
  return {
    restrict: 'A',
    templateUrl: 'branchTestSelectorView',
    controller: 'BranchTestSelectorController',
    controllerAs: 'BTSC',
    bindToController: true,
    scope: {
      data: '=', //Probably a containerFile,
      hideBranchSelector: '='
    },
    link: function ($scope, element, attrs) {
      $scope.$watch('BCSC.data.branch', function (branch) {
        if (branch) {
          $scope.fetchingCommits = true;
          return promisify(branch.commits, 'fetch')()
            .then($scope.BCSC.onCommitFetch)
            .catch(errs.handler)
            .finally(function () {
              $scope.fetchingCommits = false;
            });
        }
      });
    }
  };
}
