'use strict';

require('app')
  .directive('repositoryForm', function repositoryForm(
    $q,
    errs,
    fetchRepoBranches,
    hasKeypaths,
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
        $q.all({
          acv: watchOncePromise($scope, 'state.acv', true),
          branches: watchOncePromise($scope, 'state.repo.branches', true)
        })
          .then(function () {
            if (!$scope.state.branch) {
              return promisify(
                $scope.state.repo,
                'fetchBranch'
              )($scope.state.acv.attrs.branch);
            }
          })
          .then(function (selectedBranch) {
            if (selectedBranch) {
              $scope.state.branch = selectedBranch;
            }
            if (!keypather.get($scope.state, 'repo.branches.models.length')) {
              $scope.state.repo.branches.add($scope.state.branch);
              // Don't fetch until the next digest cycle so the fancy select has enough time to draw
              $scope.$evalAsync(function () {
                return fetchRepoBranches($scope.state.repo);
              });
            }
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
