'use strict';

require('app')
  .directive('branchCommitSelector', branchCommitSelector);

/*
 * This directive requires the following values to be on data:
 *  branch,
 *  commit,
 *  latestCommit,
 */
function branchCommitSelector(
  errs,
  promisify
) {
  return {
    restrict: 'A',
    templateUrl: 'branchCommitSelectorView',
    controller: 'BranchCommitSelectorController',
    controllerAs: 'BCSC',
    bindToController: true,
    scope: {
      data: '=', //Probably a containerFile,
      hideBranchSelector: '=',
      updateInstance: '&',
      instance: '='
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
