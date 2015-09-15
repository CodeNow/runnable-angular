'use strict';

require('app')
  .controller('RepositoryDetailsModalController', RepositoryDetailsModalController);
/**
 * controller RepositoryDetailsModalController
 * @ngInject
 */
function RepositoryDetailsModalController(
  fetchCommitData,
  loading,
  updateInstanceWithNewAcvData,

  acv,
  instance,
  close
) {
  var RDMC = this;
  this.appCodeVersion = acv;
  this.instance = instance;
  this.close = close;


  this.data = {
    repo: this.appCodeVersion.githubRepo,
    acv: this.appCodeVersion,
    branch: fetchCommitData.activeBranch(this.appCodeVersion),
    commit: fetchCommitData.activeCommit(this.appCodeVersion),
    useLatest: this.appCodeVersion.attrs.useLatest,
    instance: this.instance
  };
  this.updateInstance = function () {
    loading('main', true);
    RDMC.close(
      updateInstanceWithNewAcvData(RDMC.instance, RDMC.appCodeVersion, RDMC.data)
        .finally(function () {
          loading('main', false);
        })
    );
  };
}
