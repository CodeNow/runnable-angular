'use strict';

require('app')
  .directive('setupServerModal', setupServerModal);
/**
 * @ngInject
 */
function setupServerModal(
  createNewBuild,
  $rootScope,
  errs,
  fetchOwnerRepos,
  fetchStackAnalysis,
  hasKeypaths,
  promisify,
  $log
) {
  return {
    restrict: 'A',
    templateUrl: 'setupServerModalView',
    scope: {
      actions: '=',
      data: '=',
      defaultActions: '='
    },
    link: function ($scope, elem, attrs) {
      $scope.state = {
        opts: {
          env: null
        }
      };

      fetchOwnerRepos($rootScope.dataApp.data.activeAccount.oauthName())
        .then(function (repoList) {
          $scope.data.githubRepos = repoList;
        })
        .catch(errs.handler)
        .finally(function () {
          $scope.loading = false;
        });

      $scope.selectRepo = function (repo) {
        if ($scope.repoSelected) { return; }
        $scope.repoSelected = true;
        $scope.state.opts.name = repo.attrs.name;
        return $scope.fetchStackData(repo)
          .then(function () {
            $scope.state.repo = repo;
            return createNewBuild($rootScope.dataApp.data.activeAccount);
          })
          .then(function (buildWithVersion) {
            $scope.state.build = buildWithVersion;
            $scope.state.contextVersion = buildWithVersion.contextVersion;
            return promisify(repo.branches, 'fetch')();
          })
          .then(function (branches) {
            var masterBranch = branches.models.find(hasKeypaths({'attrs.name': 'master'}));
            return promisify($scope.state.contextVersion.appCodeVersions, 'create', true)({
              repo: repo.attrs.full_name,
              branch: masterBranch.attrs.name,
              commit: masterBranch.attrs.commit.sha
            });
          })
          .catch(function (err) {
            errs.handler(err);
          })
          .finally(function () {
            $scope.repoSelected = false;
          });
      };
      $scope.fetchStackData = function (repo) {
        function setStackSelectedVersion(stack, versions) {
          if (versions[stack.key]) {
            stack.suggestedVersion = versions[stack.key];
          }
          if (stack.dependencies) {
            stack.dependencies.forEach(function (childStack) {
              setStackSelectedVersion(childStack, versions);
            });
          }
        }
        return fetchStackAnalysis(repo).then(function (data) {
          if (!data.languageFramework) {
            $log.warn('No language detected');
            return;
          }
          if (data.languageFramework === 'ruby_ror') {
            data.languageFramework = 'rails';
          }
          repo.stackAnalysis = data;
          var stack = $scope.data.stacks.find(hasKeypaths({
            'key': data.languageFramework.toLowerCase()
          }));
          if (stack) {
            setStackSelectedVersion(stack, data.version);
          }
          return stack;
        });
      };

    }
  };
}
