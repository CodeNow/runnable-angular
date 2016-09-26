'use strict';

require('app')
  .controller('EditRepoCommitController', EditRepoCommitController);
/**
 * controller RepositoryDetailsModalController
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
  ModalService
) {
    var ERCC = this;

    $scope.$watch('ERCC.acv', function (newAcv) {
      if (newAcv) {
        var branch = ERCC.acv.githubRepo.newBranch(ERCC.acv.attrs.branch, {warn: false});
        $q.all({
          activeCommit: fetchCommitData.activeCommit(ERCC.acv), 
          branchCommits: promisify(branch.commits, 'fetch')()
        })
          .then(function(commits) {
            ERCC.activeCommit = commits.activeCommit;
            ERCC.latestBranchCommit = keypather.get(commits, 'branchCommits.models[0]');
            ERCC.isLatestCommitDeployed = ERCC.activeCommit.attrs.sha === ERCC.latestBranchCommit.attrs.sha;
          })
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
          ERCC.$emit('change-commit', commitSha);
          ERCC.$broadcast('close-popovers');
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
      } else {
        return keypather.get(ERCC.instance, 'attrs.locked');
      }
    };

    ERCC.updateInstance = function () {
      var updateInstance = function () {
        return $q.when()
          .then(function () {
            loading('main', true);
            if (!RDMC.hasLockedBeenUpdated()) {
              return;
            }
            return promisify(instance, 'update')({
              locked: RDMC.data.locked
            });
          })
          .then(function () {
            if (RDMC.hasCommitBeenUpdated()) {
              return updateInstanceWithNewAcvData(RDMC.instance, RDMC.appCodeVersion, RDMC.data);
            }
          })
            .finally(function () {
              loading('main', false);
            });
      };

      return $q.when()
        .then(function () {
          var mainACV = RDMC.instance.contextVersion.getMainAppCodeVersion();
          var repo = mainACV.attrs.repo;
          var branch = mainACV.attrs.branch;

          var isolation = keypather.get(RDMC, 'instance.isolation');
          if (!isolation) {
            return true;
          }
          var childInstances = isolation.instances.models;
          var groupMaster = isolation.groupMaster;
          var instances = childInstances.concat(groupMaster);
          var instanceWithSameRepoAndBranch = instances.filter(function (i) {
            if (!i) {
              return false;
            }
            var iACV = i.contextVersion.getMainAppCodeVersion();
            if (iACV && iACV.attrs.repo === repo && iACV.attrs.branch === branch) {
              return true;
            }
            return false;
          });
          if (instanceWithSameRepoAndBranch.length > 1) {
            return RDMC.confirmAutoDeploy();
          }
          return true;
        })
        .then(function (confirmed) {
          if (!confirmed) {
            return;
          }
          return RDMC.close(updateInstance());
        });
    };
  };
