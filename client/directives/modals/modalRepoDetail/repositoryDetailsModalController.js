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
  updateInstanceWithNewAcvData
) {
  var RDMC = this;
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
    RDMC.defaultActions.close(function () {
      updateInstanceWithNewAcvData(RDMC.instance, RDMC.appCodeVersion, RDMC.data)
        .finally(function () {
          loading('main', false);
        });
    });
  };
}
