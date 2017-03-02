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
  $q,
  errs,
  fetchCommitData,
  promisify,
  github
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
      updateInstance: '&'
    },
    link: function ($scope, element, attrs) {
      $scope.$watch('BCSC.data.branch', function (branch) {
        if (branch) {
          $scope.fetchingCommits = true;
          var acv = $scope.BCSC.data.acv;
          return $q.all({
            branchOrPRCommits: github.branchOrPRCommits(acv),
            activeCommit: fetchCommitData.activeCommit(acv)
          })
            .then(function(commitPromises) {
              $scope.BCSC.data.commit = commitPromises.activeCommit;
              return $scope.BCSC.onCommitFetch(commitPromises.branchOrPRCommits);
            })
            .catch(errs.handler)
            .finally(function () {
              $scope.fetchingCommits = false;
            });
        }
      });
    }
  };
}
