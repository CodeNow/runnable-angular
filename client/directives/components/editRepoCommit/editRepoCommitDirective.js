'use strict';

require('app')
  .directive('editRepoCommit', editRepoCommit);
/**
 * @ngInject
 */
function editRepoCommit(
  fetchCommitData,
  keypather,
  promisify,
  errs,
  loading,
  $rootScope,
  ModalService
) {
  return {
    restrict: 'A',
    templateUrl: 'editRepoCommitView',
    scope: {
      acv: '= model',
      instance: '='
    },
    link: function ($scope) {
      $scope.$watch('acv', function (newAcv) {
        if (newAcv) {
          fetchCommitData.activeCommit($scope.acv)
            .then(function (commit) {
              $scope.activeCommit = commit;
            });
        }
      });

      $scope.actions = {
        toggleEditCommits: function () {
          var branch = fetchCommitData.activeBranch($scope.acv);
          fetchCommitData.branchCommits(branch);
          $scope.popoverRepositoryToggle.data.branch = branch;
          $scope.popoverRepositoryToggle.data.commit = $scope.activeCommit;
        },
        openRepoDetailsModal: function () {
          ModalService.showModal({
            templateUrl: 'repositoryDetailsModalView',
            controller: 'RepositoryDetailsModalController',
            controllerAs: 'RDMC',
            inputs: {
              instance: $scope.instance,
              acv: $scope.acv
            }
          })
            .catch(errs.handler);
        },
        openInviteAdminModal: function () {
          ModalService.showModal({
            controller: 'InviteAdminModalController',
            controllerAs: 'IAMC',
            templateUrl: 'inviteAdminModalView',
            inputs: {
              instance: $scope.instance,
              isFromAutoDeploy: true
            }
          })
            .catch(errs.handler);
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
      $scope.autoDeploy = function (isLocked) {
        if (arguments.length > 0) {
          if ($rootScope.isLoading.autoDeploy) {
            return !isLocked;
          }
          loading('autoDeploy', true);
          return promisify($scope.instance, 'update')({
            locked: isLocked
          })
            .catch(errs.handler)
            .then(function () {
              loading('autoDeploy', false);
            });
        } else {
          return keypather.get($scope.instance, 'attrs.locked');
        }
      };
    }
  };
}
