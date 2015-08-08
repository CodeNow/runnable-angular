'use strict';

require('app')
  .directive('branchCommitSelector', branchCommitSelector);


/*
 * This directive requires the following actions in the parent scopoe:
 *   create, remove, update
 * Those actions must return a promise that gets resolved when the action is finished.
 *
 * There also needs to be a data attribute containing at minimum:
 */
function branchCommitSelector(
  $rootScope,
  errs,
  promisify
) {
  return {
    restrict: 'A',
    templateUrl: function () {
      if ($rootScope.featureFlags.additionalRepositories) {
        return 'branchCommitSelectorView';
      }
      return 'branchCommitSelectorViewOld';
    },
    controller: 'BranchCommitSelectorController',
    controllerAs: 'BCSC',
    bindToController: true,
    scope: {
      data: '=' //Probably a containerFile,
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
