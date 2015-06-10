'use strict';

require('app')
  .directive('editRepoCommit', editRepoCommit);
/**
 * @ngInject
 */
function editRepoCommit(
  fetchCommitData
) {
  return {
    restrict: 'A',
    templateUrl: 'viewEditRepoCommit',
    scope: {
      acv: '= model'
    },
    link: function ($scope) {
      $scope.$watch('acv', function (newAcv) {
        if (newAcv) {
          $scope.activeCommit = fetchCommitData.activeCommit($scope.acv);
        }
      });


      $scope.actions = {
        toggleEditCommits: function () {
          var branch = fetchCommitData.activeBranch($scope.acv);
          fetchCommitData.branchCommits(branch);
          $scope.popoverRepositoryToggle.data.branch = branch;
          $scope.popoverRepositoryToggle.data.commit = $scope.activeCommit;
        }
      };
      $scope.popoverRepositoryToggle = {
        data: {
          acv: $scope.acv
        },
        actions: {
          selectCommit: function (commitSha) {
            $scope.acv.attrs.commit = commitSha;
            $scope.$emit('change-commit', commitSha);
            $scope.$broadcast('close-popovers');
          }
        }
      };
    }
  };
}
