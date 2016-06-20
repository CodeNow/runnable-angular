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

  RDMC.updateInstance = function () {
    var promise = $q.when()
      .then(function () {
        loading('main', true);
        if (RDMC.data.locked === RDMC.instance.attrs.locked) {
          return;
        }
        return promisify(instance, 'update')({
          locked: RDMC.data.locked
        });
      })
      .then(function () {
        return updateInstanceWithNewAcvData(RDMC.instance, RDMC.appCodeVersion, RDMC.data);
      })
        .finally(function () {
          loading('main', false);
        });

    return $q.when()
      .then(function () {
        var mainACV = RDMC.instance.contextVersion.getMainAppCodeVersion();
        var repo = mainACV.attrs.repo;
        var branch = mainACV.attrs.branch;

        var childInstances = RDMC.instance.isolation.instances.models;
        var groupMaster = RDMC.instance.isolation.groupMaster;
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
        return RDMC.close();
      });
  };
}
