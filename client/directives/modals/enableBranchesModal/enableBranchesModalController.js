'use strict';

require('app')
  .controller('EnableBranchesModalController', EnableBranchesModalController);
/**
 * controller EnableBranchesModalController
 * @ngInject
 */
function EnableBranchesModalController(
  errs,
  loading,
  promisify,
  close,
  instance
) {
  var EBMC = this;
  EBMC.instance = instance;
  EBMC.close = close;

  EBMC.repoName = instance.getRepoName();

  EBMC.enableBranches = function () {
    loading('main', true);
    EBMC.close(
      promisify(EBMC.instance, 'update')({
        enableBranches: true
      })
        .catch(errs.handler)
        .finally(function () {
          loading('main', false);
        })
    );
  };
}
