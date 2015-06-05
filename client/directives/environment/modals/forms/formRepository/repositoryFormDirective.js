'use strict';

require('app')
  .directive('repositoryForm', function repositoryForm(
    $q,
    errs,
    hasKeypaths,
    keypather,
    promisify,
    watchOncePromise
  ) {
    return {
      restrict: 'A',
      templateUrl: 'viewFormRepository',
      scope: {
        state: '=',
        startCommandCanDisable: '=?'
      },
      link: function ($scope) {
        $q.all({
          acv: watchOncePromise($scope, 'state.acv', true),
          branches: watchOncePromise($scope, 'state.repo.branches', true)
        })
          .then(function (data) {
            console.log('data', data);
            if (!keypather.get(data, 'branches.models.length')) {
              return promisify(data.branches, 'fetch')();
            }
            return data.branches;
          })
          .then(function (branches) {
            if ($scope.state.branch) { return; }
            $scope.state.branch = branches.models.find(hasKeypaths({
              'attrs.name': $scope.state.acv.attrs.branch
            }));
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
                return promisify(mainAcv, 'update')(newState);
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
