'use strict';

require('app')
  .directive('repositoryDetailsModal', repositoryDetailsModal);
/**
 * directive repositoryDetailsModal
 * @ngInject
 */
function repositoryDetailsModal(
  fetchCommitData,
  loading,
  updateInstanceWithNewAcvData
) {
  return {
    restrict: 'A',
    templateUrl: 'repositoryDetailsModalView',
    controller: function () {
      var RDMC = this;
      this.data = {
        repo: this.appCodeVersion.githubRepo,
        acv: this.appCodeVersion,
        branch: fetchCommitData.activeBranch(this.appCodeVersion),
        commit: fetchCommitData.activeCommit(this.appCodeVersion),
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
    },
    controllerAs: 'RDMC',
    bindToController: true,
    scope: {
      appCodeVersion: '=currentModel',
      defaultActions: '=',
      instance: '=data'
    }
  };
}
