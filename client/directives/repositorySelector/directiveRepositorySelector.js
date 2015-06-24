'use strict';

require('app')
  .directive('repositorySelector', repositorySelector);


/*
 * This directive requires the following actions in the parent scopoe:
 *   create, remove, update
 * Those actions must return a promise that gets resolved when the action is finished.
 *
 * There also needs to be a data attribute containing at minimum:
 * appCodeVersions (This is used to filter out the repo list)
 * repo (Optional, this is if you want to edit an existing repo)
 * gitDataOnly (Optional, this makes it so no destination or build commands will be set, it skips view 2)
 */
function repositorySelector(
  errs,
  hasKeypaths,
  promisify,
  fetchOwnerRepos,
  fetchRepoBranches,
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
        fetchRepoBranches($scope.data.repo)
          .catch(errs.handler);
        $scope.state.view = 2;
        $scope.state.fromServer = true;
      } else {
        var Repo = cardInfoTypes.Repository;
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


          fetchRepoBranches(repo)
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
              if (!$scope.data.gitDataOnly) {
                $scope.repoSelector.data.commit = commits.models[0];
              }
              $scope.repoSelector.data.name = $scope.repoSelector.data.repo.attrs.name;
            })
            .catch(errs.handler);
        },
        selectBranch: function (branch) {
          $scope.repoSelector.data.latestCommit = false;
          $scope.repoSelector.data.branch = branch;
          promisify(branch.commits, 'fetch')()
            .catch(errs.handler);
        },
        selectCommit: function (commit){
          if ($scope.state.saving) {
            return;
          }

          $scope.repoSelector.data.latestCommit = false;
          $scope.repoSelector.data.commit = commit;
          if ($scope.data.gitDataOnly) {
            $scope.repoSelector.actions.save();
          } else {
            $scope.state.view = 2;
          }
        },
        save: function () {
          $scope.state.saving = true;
          if ($scope.state.fromServer) {
            $scope.actions.update($scope.repoSelector.data);
            $rootScope.$broadcast('close-popovers');
          } else {
            $scope.actions.create($scope.repoSelector.data);
            $rootScope.$broadcast('close-popovers');
          }
        },
        remove: function () {
          $scope.state.saving = true;
          $scope.actions.remove($scope.repoSelector.data);
          $rootScope.$broadcast('close-popovers');
        },
        leaveCommitSelect: function () {
          $scope.state.view = $scope.data.gitDataOnly ? 1 : 2;
        }
      };
    }
  };
}
