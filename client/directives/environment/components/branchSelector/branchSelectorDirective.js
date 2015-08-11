'use strict';

require('app')
  .directive('branchSelector', function branchSelector(
    $q,
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
            // <= 1 because the collection may contain the state.branch
            var shouldFetchBranches = !keypather.get(repo, 'branches.models.length');
            if (!$scope.state.branch) {
              var branchSeed = $scope.state.acv ? $scope.state.acv.attrs.branch : repo.attrs.default_branch;
              $scope.state.branch = repo.newBranch(branchSeed, {warn: false});
            }
            // If we only have 1 branch, we most likely need to fetch the branches
            if (shouldFetchBranches) {
              repo.branches.add($scope.state.branch);
              $scope.branchFetching = true;
              // Don't fetch until the next digest cycle so the fancy select has enough time to draw
              $scope.$evalAsync(function () {
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
          $scope.$emit('branch::selected', newBranch);
          if ($scope.autoUpdate && $scope.state.acv) {
            var newState = {
              branch: newBranch.attrs.name,
              commit: newBranch.attrs.commit.sha
            };
            return loadingPromises.add(
              $scope.loadingPromisesTarget,
              promisify($scope.state.acv, 'update')(newState)
            )
              .catch(errs.handler);
          }
        };
      }
    };
  });
