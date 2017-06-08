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
        function populateDefaultBranch () {
          if (!keypather.get($scope, 'state.branch.client') && keypather.get($scope, 'state.repo.branches.models.length')) {
            var branchSeed = $scope.state.acv ? $scope.state.acv.attrs.branch : $scope.state.repo.attrs.default_branch;
            $scope.state.branch = $scope.state.repo.branches.models.find(function (branch) {
              return branch.attrs.name.toLowerCase() === branchSeed.toLowerCase();
            });
          }
        }
        $scope.$watch('state.repo', function (repo) {
          if (repo) {
            populateDefaultBranch();
            if (!keypather.get(repo, 'branches.models.length')) {
              $scope.branchFetching = true;
              // Don't fetch until the next digest cycle so the fancy select has enough time to draw
              $scope.$applyAsync(function () {
                return fetchRepoBranches($scope.state.repo)
                  .catch(errs.handler)
                  .finally(function () {
                    $scope.branchFetching = false;
                    populateDefaultBranch();
                  });
              });
            }
          }
        });

        $scope.masterBranch = function () {
          return $scope.state.repo.branches.models.find(function (branch) {
            return branch.attrs.name === 'master';
          });
        };

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
