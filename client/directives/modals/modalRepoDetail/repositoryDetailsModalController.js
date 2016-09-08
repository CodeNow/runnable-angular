'use strict';

require('app')
  .controller('RepositoryDetailsModalController', RepositoryDetailsModalController);
/**
 * controller RepositoryDetailsModalController
 * @ngInject
 */
function RepositoryDetailsModalController(
  $q,
  fetchCommitData,
  keypather,
  loading,
  ModalService,
  promisify,
  updateInstanceWithNewAcvData,

  acv,
  instance,
  close
) {
  var RDMC = this;
  RDMC.appCodeVersion = acv;
  RDMC.instance = instance;
  RDMC.close = close;


  RDMC.data = {
    repo: RDMC.appCodeVersion.githubRepo,
    acv: RDMC.appCodeVersion,
    branch: fetchCommitData.activeBranch(RDMC.appCodeVersion),
    useLatest: RDMC.appCodeVersion.attrs.useLatest,
    locked: RDMC.instance.attrs.locked,
    instance: RDMC.instance
  };
  fetchCommitData.activeCommit(RDMC.appCodeVersion)
    .then(function (commit) {
      RDMC.data.commit = commit;
    });

  RDMC.confirmAutoDeploy = function () {
    return ModalService.showModal({
      controller: 'ConfirmationModalController',
      controllerAs: 'CMC',
      templateUrl: 'confirmSyncModalView',
    })
      .then(function (modal) {
        return modal.close;
      });
  };

  RDMC.hasCommitBeenUpdated = function () {
    var newCommitSha = keypather.get(RDMC, 'data.commit.attrs.sha');
    var oldCommitSha = keypather.get(RDMC, 'appCodeVersion.attrs.commit');
    return newCommitSha && newCommitSha !== oldCommitSha;
  };

  RDMC.hasLockedBeenUpdated = function () {
    return RDMC.data.locked === RDMC.instance.attrs.locked;
  };

  RDMC.updateInstance = function () {
    var updateInstance = function () {
      return $q.when()
        .then(function () {
          loading('main', true);
          if (RDMC.hasLockedBeenUpdated()) {
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
}
