'use strict';

require('app')
  .directive('editRepoCommit', editRepoCommit);
/**
 * @ngInject
 */
function editRepoCommit(
  $q,
  $state,
  fetchCommitData,
  keypather,
  promisify,
  errs,
  loading,
  $rootScope,
  ModalService,
  fetchUser,
  fetchGithubOrgId
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
          $scope.activeCommit = fetchCommitData.activeCommit($scope.acv);
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
      $scope.userPopoverActions = {
        inviteUser: function (user) {
          user.inviteSending = true;
          return $q.all({
              user: fetchUser(),
              githubOrgId: fetchGithubOrgId($state.params.userName)
            })
            .then(function (response) {
              return promisify(response.user, 'createTeammateInvitation')({
                organization: {
                  github: response.githubOrgId
                },
                recipient: {
                  email: user.email,
                  github: user.id
                }
              });
            })
            .then(function (invitationModel) {
              user.inviteSent = true;
              return invitationModel;
            })
            .catch(errs.handler)
            .finally(function () {
                user.inviteSending = false;
            });

        },
        goToTeammatesSettingsModal: function () {
          $scope.$broadcast('close-popovers');
          return ModalService.showModal({
            controller: 'SettingsModalController',
            controllerAs: 'SEMC',
            templateUrl: 'settingsModalView',
            inputs: {
              tab: 'teamManagement'
            }
          });
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
