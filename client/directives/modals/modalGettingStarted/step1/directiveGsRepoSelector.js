'use strict';

require('app')
  .directive('gsRepoSelector', gsRepoSelector);
/**
 * @ngInject
 */
function gsRepoSelector(
  errs,
  fetchOwnerRepos,
  fetchStackAnalysis,
  hasKeypaths,
  $log
) {
  return {
    restrict: 'A',
    templateUrl: 'viewModalRepoSelector',
    scope: {
      actions: '=',
      data: '=',
      state: '='
    },
    link: function ($scope, elem, attrs) {
      function fetchStackData(repo) {
        return fetchStackAnalysis(repo).then(function (data) {
          if (!data.languageFramework) {
            $scope.state.stack = $scope.data.stacks[0];
            $log.warn('No language detected');
            return;
          }
          $scope.state.stack = $scope.data.stacks.find(hasKeypaths({
            'key': data.languageFramework.toLowerCase()
          })) || $scope.data.stacks[0];
          setStackSelectedVersion($scope.state.stack, data.version);
          if (data.serviceDependencies && data.serviceDependencies.length) {
            var unwatch = $scope.$watch('data.allDependencies', function (allDeps) {
              if (allDeps) {
                unwatch();
                var includedDeps = data.serviceDependencies.map(
                  function (dep) {
                    return allDeps.models.find(
                        hasKeypaths({'attrs.name.toLowerCase()': dep.toLowerCase()})
                    ) || false;
                  }
                );
                includedDeps.forEach(function (dep) {
                  if (dep) {
                    $scope.actions.addDependency(dep);
                  }
                });
              }
            });
          }
        }).catch(errs.handler);
      }
      $scope.selectRepo = function (repo) {
        if ($scope.state.repoSelected) { return; }
        $scope.state.repoSelected = true;
        repo.spin = true;
        $scope.state.selectedRepo = repo;
        repo.branches.fetch(function(err) {
          if (err) { return errs.handler(err); }
          $scope.state.activeBranch =
              repo.branches.models.find(hasKeypaths({'attrs.name': 'master'}));
          if (!$scope.state.activeBranch) { return errs.handler(new Error('No branches found')); }
        });
        fetchStackData(
          repo.attrs.full_name
        ).catch(function (err) {
          $scope.state.repoSelected = false;
          errs.handler(err);
        }).finally(function () {
          delete repo.spin;
          $scope.actions.nextStep(2);
        });
      };

      $scope.$watch('data.activeAccount', function (n) {
        if (n) {
          $scope.loading = true;
          $scope.githubRepos = null;
          fetchOwnerRepos(
            n.oauthName()
          ).then(function (repoList) {
            $scope.githubRepos = repoList;
          }).catch(
            errs.handler
          ).finally(function () {
            $scope.loading = false;
          });
        }
      });

      function setStackSelectedVersion(stack, versions) {
        if (versions[stack.key]) {
          stack.selectedVersion = versions[stack.key];
        }
        if (stack.dependencies) {
          stack.dependencies.forEach(function (childStack) {
            setStackSelectedVersion(childStack, versions);
          });
        }
      }
    }
  };
}
