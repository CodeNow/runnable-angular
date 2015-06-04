'use strict';

require('app')
  .directive('repositorySelector', repositorySelector);


/*
 * This directive requires the following actions in the parent scopoe:
 *   create, remove, update
 * Those actions must return a promise that gets resolved when the action is finished.
 *
 * There also needs to be a data attribute containing at minimum:
 * containerFiles (This is used to filter out the repo list)
 * repo (Optional, this is if you want to edit an existing repo)
 */
function repositorySelector(
  errs,
  hasKeypaths,
  promisify,
  fetchOwnerRepos,
  $rootScope,
  cardInfoTypes
) {
  return {
    restrict: 'A',
    templateUrl: 'viewRepositorySelector',
    link: function ($scope, elem, attrs) {

      // Init state to new creation mode
      $scope.state = {
        view: 1,
        fromServer: false
      };

      $scope.repoSelector = {
        data: {}
      };

      // If we are given an object to start configure our states for edit mode
      if ($scope.data.repo) {
        $scope.repoSelector.data = $scope.data.repo;
        $scope.state.view = 2;
        $scope.state.fromServer = true;
      } else {
        var Repo = cardInfoTypes().Repository;
        $scope.repoSelector.data = new Repo();

        fetchOwnerRepos($rootScope.dataApp.data.activeAccount.oauthName())
          .then(function (repoList) {
            $scope.repoSelector.data.githubRepos = repoList;
          })
          .catch(errs.handler);
      }

      $scope.repoSelector.actions = {
        selectRepo: function (repo) {
          $scope.repoSelector.data.repo = repo;
          $scope.repoSelector.data.loading = true;
          $scope.repoSelector.data.repo.loading = true;

          promisify(repo.branches, 'fetch')()
            .then(function (branches) {
              return branches.models.find(hasKeypaths({'attrs.name': repo.attrs.default_branch}));
            })
            .then(function (branch) {
              $scope.repoSelector.data.branch = branch;
              return promisify(branch.commits, 'fetch')();
            })
            .then(function (commits) {
              $scope.repoSelector.data.loading = false;
              $scope.repoSelector.data.repo.loading = false;
              $scope.state.view = 2;
              $scope.repoSelector.data.commit = commits.models[0];
              $scope.repoSelector.data.name = $scope.repoSelector.data.repo.attrs.name;
            })
            .catch(errs.handler);
        },
        toggleSelectLatestCommit: function () {
          if ($scope.repoSelector.data.latestCommit) {
            $scope.repoSelector.data.commit = $scope.repoSelector.data.branch.commits.models[0];
            $scope.state.view = 2;
          }
        },
        selectBranch: function (branch) {
          $scope.repoSelector.data.latestCommit = false;
          $scope.repoSelector.data.branch = branch;
          promisify(branch.commits, 'fetch')()
            .catch(errs.handler);
        },
        selectCommit: function (commit){
          $scope.repoSelector.data.latestCommit = false;
          $scope.repoSelector.data.commit = commit;
          $scope.state.view = 2;
        },
        save: function () {
          $scope.state.saving = true;
          if ($scope.state.fromServer) {
            $scope.actions.update($scope.repoSelector.data)
              .then(function () {
                $rootScope.$broadcast('close-popovers');
              });
          } else {
            $scope.actions.create($scope.repoSelector.data)
              .then(function () {
                $rootScope.$broadcast('close-popovers');
              });
          }
        },
        remove: function () {
          $scope.state.saving = true;
          $scope.actions.remove($scope.repoSelector.data)
            .then(function () {
              $rootScope.$broadcast('close-popovers');
            });
        }
      };
    }
  };
}
