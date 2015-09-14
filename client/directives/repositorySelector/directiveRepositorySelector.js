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
  promisify,
  fetchOwnerRepos,
  $rootScope,
  cardInfoTypes,
  DirtyChecker
) {
  return {
    restrict: 'A',
    templateUrl: 'viewRepositorySelector',
    link: function ($scope, elem, attrs) {

      // Init state to new creation mode
      $scope.state = {
        fromServer: false
      };

      $scope.repoSelector = {
        data: {}
      };

      // If we are given an object to start configure our states for edit mode
      if ($scope.data.repo) {
        $scope.repoSelector.data = $scope.data.repo;
        $scope.state.fromServer = true;
        $scope.$broadcast('go-to-panel', 'repoOptions', 'immediate');
      } else {
        var Repo = cardInfoTypes.Repository;
        $scope.repoSelector.data = new Repo();

        fetchOwnerRepos($rootScope.dataApp.data.activeAccount.oauthName())
          .then(function (repoList) {
            $scope.repoSelector.data.githubRepos = repoList;
          })
          .catch(errs.handler);
      }

      $scope.repoSelector.data.instance = $scope.data.instance;
      $scope.$on('commit::selected', function () {
        if ($scope.data.gitDataOnly) {
          $scope.repoSelector.actions.save();
        } else {
          $scope.$broadcast('go-to-panel', 'repoOptions', 'back');
        }
      });
      $scope.dirtyChecker = new DirtyChecker($scope.repoSelector.data, [
        'repo.attrs.name',
        'branch.attrs.name',
        'commit.attrs.sha',
        'useLatest'
      ]);

      $scope.repoSelector.actions = {
        selectRepo: function (repo) {
          $scope.repoSelector.data.repo = repo;
          $scope.repoSelector.data.loading = true;
          $scope.repoSelector.data.repo.loading = true;
          // Reset this value each time the repo changes
          $scope.repoSelector.data.useLatest = $rootScope.featureFlags.additionalRepositories;

          $scope.repoSelector.data.branch = repo.newBranch(repo.attrs.default_branch);
          if (!repo.branches.models.length) {
            repo.branches.add($scope.state.branch);
          }
          promisify($scope.repoSelector.data.branch.commits, 'fetch')()
            .then(function (commits) {
              $scope.repoSelector.data.loading = false;
              $scope.repoSelector.data.repo.loading = false;
              $scope.$broadcast('go-to-panel', 'repoOptions');
              if (!$scope.data.gitDataOnly) {
                $scope.repoSelector.data.commit = commits.models[0];
              }
              $scope.repoSelector.data.name = $scope.repoSelector.data.repo.attrs.name;
            })
            .catch(errs.handler);
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
        }
      };
    }
  };
}
