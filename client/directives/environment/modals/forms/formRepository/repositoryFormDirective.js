'use strict';

require('app')
  .directive('repositoryForm', function repositoryForm(
    $q,
    errs,
    fetchRepoBranches,
    keypather,
    loadingPromises,
    promisify,
    watchOncePromise
  ) {
    return {
      restrict: 'A',
      templateUrl: 'viewFormRepository',
      scope: {
        state: '=',
        startCommandCanDisable: '=?',
        loadingPromisesTarget: '@?'
      },
      link: function ($scope) {
        $scope.branchFetching = true;
        watchOncePromise($scope, 'state.acv', true)
          .then(function () {
            if (!$scope.state.branch) {
              $scope.state.branch = $scope.state.repo.newBranch($scope.state.acv.attrs.branch);
              $scope.state.repo.branches.add($scope.state.branch);
              return promisify($scope.state.branch, 'fetch')();
            }
            return null;
          })
          .then(function (selectedBranch) {
            if (selectedBranch || !keypather.get($scope.state, 'repo.branches.models.length')) {
              return $q(function (resolve, reject) {
                // Don't fetch until the next digest cycle so the fancy select has enough time to draw
                $scope.$evalAsync(function () {
                  return fetchRepoBranches($scope.state.repo)
                    .then(resolve)
                    .catch(reject);
                });
              });
            }
          })
          .catch(errs.handler)
          .finally(function () {
            $scope.branchFetching = false;
          });

        $scope.$watch('state.branch', function (newBranch, oldBranch) {
          if (newBranch && oldBranch && newBranch.attrs.name !== oldBranch.attrs.name) {
            return watchOncePromise($scope, 'state.acv', true)
              .then(function (mainAcv) {
                var newState = {
                  branch: newBranch.attrs.name,
                  commit: newBranch.attrs.commit.sha
                };
                mainAcv.setState(newState);
                var promise;
                if ($scope.loadingPromisesTarget) {
                  promise = loadingPromises.add(
                    $scope.loadingPromisesTarget,
                    promisify(mainAcv, 'update')
                  );
                } else {
                  promise = promisify(mainAcv, 'update');
                }
                return promise(newState);
              })
              .catch(errs.handler)
              .finally(function () {
                $scope.state.acv.resetState();
              });
          }
        });
      }
    };
  });
