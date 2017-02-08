'use strict';

/*
 * This directive requires the following values to be on state:
 *  repo
 *  branch
 *
 *  Optionally, it can also use:
 *  acv > appCodeVersion
 */
require('app')
  .directive('branchSelector', function branchSelector(
    errs,
    fetchRepoBranches,
    keypather,
    loadingPromises,
    promisify
  ) {
    return {
      restrict: 'A',
      templateUrl: 'branchSelectorView',
      scope: {
        state: '=',
        loadingPromisesTarget: '@?',
        autoUpdate: '=?' // True if the acv should get automatically updated upon branch change
      },
      link: function ($scope, element, attrs) {
        $scope.$watch('state.repo', function (repo) {
          if (repo) {
            if (!$scope.state.branch) {
              var branchSeed = $scope.state.acv ? $scope.state.acv.attrs.branch : repo.attrs.default_branch;
              $scope.state.branch = repo.newBranch(branchSeed, {warn: false});
            }
            if (!keypather.get(repo, 'branches.models.length')) {
              repo.branches.add($scope.state.branch);
              $scope.branchFetching = true;
              // Don't fetch until the next digest cycle so the fancy select has enough time to draw
              $scope.$applyAsync(function () {
                return fetchRepoBranches($scope.state.repo)
                  .catch(errs.handler)
                  .finally(function () {
                    $scope.branchFetching = false;
                  });
              });
            }
          }
        });

        $scope.onBranchChange = function (newBranch) {
          if ($scope.autoUpdate && $scope.state.acv) {
            var newState = {
              branch: newBranch.attrs.name,
              commit: newBranch.attrs.commit.sha
            };
            return loadingPromises.add(
              $scope.loadingPromisesTarget,
              promisify($scope.state.acv, 'update')(newState)
            )
              .then(function () {
                $scope.$emit('updatedACV');
              })
              .catch(errs.handler);
          }
        };
      }
    };
  });
