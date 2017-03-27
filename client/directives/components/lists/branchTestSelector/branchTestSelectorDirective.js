'use strict';

require('app')
  .directive('branchTestSelector', branchTestSelector);

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
      branch: '=',
      commit: '=',
      instanceName: '=',
      hideBranchSelector: '='
    },
    link: function ($scope, element, attrs) {
      $scope.$watch('BCSC.branch', function (branch) {
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
