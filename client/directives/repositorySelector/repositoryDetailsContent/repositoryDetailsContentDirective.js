'use strict';

require('app')
  .directive('repositoryDetailsContent', repositoryDetailsContent);


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
function repositoryDetailsContent(
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
    scope: {
      data: '=', //Probably a containerFile
      parentActions: '=actions'
    },
    link: function ($scope, elem, attrs) {

      $scope.$watch('data.repo', function (repo) {
        if (repo) {
          $scope.fetchingBranches = true;
          fetchRepoBranches(repo)
            .catch(errs.handler)
            .finally(function () {
              $scope.fetchingBranches = false;
            });
        }
      });


      $scope.actions = {
        selectBranch: function (branch) {
          $scope.data.latestCommit = false;
          $scope.data.branch = branch;
          promisify(branch.commits, 'fetch')()
            .catch(errs.handler);
        },
        selectCommit: function (commit){
          if ($scope.state.saving) {
            return;
          }

          $scope.data.latestCommit = false;
          $scope.data.commit = commit;
          if ($scope.parentActions.onCommitSelect) {
            $scope.parentActions.onCommitSelect();
          }
        },
        save: function () {
          if ($scope.state.fromServer) {
            $scope.parentActions.update($scope.repoSelector.data);
          } else {
            $scope.parentActions.create($scope.repoSelector.data);
          }
        },
        remove: function () {
          $scope.state.saving = true;
          $scope.parentActions.remove($scope.repoSelector.data);
        },
        leaveCommitSelect: function () {
          $scope.state.view = $scope.data.gitDataOnly ? 1 : 2;
        }
      };
    }
  };
}
