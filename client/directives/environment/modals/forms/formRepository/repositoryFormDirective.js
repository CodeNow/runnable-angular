'use strict';

require('app')
  .directive('repositoryForm', function repositoryForm(
    errs,
    hasKeypaths,
    keypather,
    promisify,
    watchWhenTruthyPromise
  ) {
    return {
      restrict: 'A',
      templateUrl: 'viewFormRepository',
      scope: {
        state: '=',
        startCommandCanDisable: '=?'
      },
      link: function ($scope) {
        watchWhenTruthyPromise($scope, 'state.acv')
          .then(function () {
            return watchWhenTruthyPromise($scope, 'state.repo.branches');
          })
          .then(function (branches) {
            if (!keypather.get(branches, 'models.length')) {
              return promisify(branches, 'fetch')();
            }
            return branches;
          })
          .then(function (branches) {
            if ($scope.state.branch) { return; }
            $scope.state.branch = branches.models.find(hasKeypaths({
              'attrs.name': $scope.state.acv.attrs.branch
            }));
          });

        $scope.$watch('state.branch', function (newBranch, oldBranch) {
          if (newBranch && oldBranch && newBranch.attrs.name !== oldBranch.attrs.name) {
            return watchWhenTruthyPromise($scope, 'state.acv')
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
