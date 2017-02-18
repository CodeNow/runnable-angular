'use strict';

require('app')
  .controller('EditRepoCommitController', EditRepoCommitController);
/**
 * controller EditRepoCommitController
 * @ngInject
 */
function EditRepoCommitController(
  $q,
  $rootScope,
  $scope,
  fetchCommitData,
  keypather,
  promisify,
  errs,
  loading,
  ModalService,
  updateInstanceWithNewAcvData,
  github
) {
    var ERCC = this;
    ERCC.isLatestCommitDeployed = true;

    var repoObject = {
      branch: fetchCommitData.activeBranch(ERCC.acv),
      useLatest: ERCC.acv.attrs.useLatest,
      commit: ERCC.latestBranchCommit
    };

    $scope.$watch('ERCC.acv', function (newAcv, oldAcv) {
      if (newAcv) {
        $q.all({
          activeCommit: fetchCommitData.activeCommit(ERCC.acv),
          branchCommits: github.branchCommits(ERCC.acv)
        })
          .then(function(commits) {
            ERCC.activeCommit = commits.activeCommit;
            ERCC.latestBranchCommit = keypather.get(commits, 'branchCommits[0]');
            ERCC.isLatestCommitDeployed = ERCC.activeCommit.attrs.sha === ERCC.latestBranchCommit.sha;
          });
      }
    });

    ERCC.actions = {
      toggleEditCommits: function () {
        var branch = fetchCommitData.activeBranch(ERCC.acv);
        fetchCommitData.branchCommits(branch);
        ERCC.popoverRepositoryToggle.data.branch = branch;
        ERCC.popoverRepositoryToggle.data.commit = ERCC.activeCommit;
      },
      openRepoDetailsModal: function () {
        ModalService.showModal({
          templateUrl: 'repositoryDetailsModalView',
          controller: 'RepositoryDetailsModalController',
          controllerAs: 'RDMC',
          inputs: {
            acv: ERCC.acv,
            instance: ERCC.instance,
            updateInstance: ERCC.updateInstance
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
            instance: ERCC.instance,
            isFromAutoDeploy: true
          }
        })
          .catch(errs.handler);
      }
    };

    ERCC.popoverRepositoryToggle = {
      data: {
        acv: ERCC.acv
      },
      actions: {
        selectCommit: function (commitSha) {
          ERCC.acv.attrs.commit = commitSha;
          $scope.$emit('change-commit', commitSha);
          $scope.$broadcast('close-popovers');
        }
      }
    };

    ERCC.autoDeploy = function (isLocked) {
      if (arguments.length > 0) {
        if ($rootScope.isLoading.autoDeploy) {
          return !isLocked;
        }
        loading('autoDeploy', true);
        return promisify(ERCC.instance, 'update')({
          locked: isLocked
        })
          .catch(errs.handler)
          .then(function () {
            loading('autoDeploy', false);
          });
      }
      return keypather.get(ERCC.instance, 'attrs.locked');
    };

    ERCC.updateInstance = function() {
      loading('updatingInstance', true);
      $q.when(github.branchCommits(ERCC.acv))
        .then(function(commits) {
          ERCC.latestBranchCommit = commits[0];
          repoObject.commit = ERCC.latestBranchCommit;
          if (ERCC.activeCommit.attrs.sha !== ERCC.latestBranchCommit.sha) {
            return updateInstanceWithNewAcvData(ERCC.instance, ERCC.acv, repoObject)
              .then(function(instance) {
                loading('updatingInstance', false);
              })
              .catch(function(err) {
                errs.handler(err);
                loading('updatingInstance', false);
              });
          }
        });
    };
  }
