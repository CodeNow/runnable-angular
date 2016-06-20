'use strict';

require('app')
  .controller('BranchCommitSelectorController', BranchCommitSelectorController);

function BranchCommitSelectorController(
  $scope,
  $rootScope,
  errs,
  loading,
  promisify,
  keypather
) {
  var BCSC = this;

  BCSC.onCommitFetch = function (commits) {
    if (!commits.models.length) { return; }
    if (BCSC.data.commit) {
      BCSC.data.commit = commits.models.find(function (otherCommits) {
        return otherCommits === BCSC.data.commit;
      }) || commits.models[0];
    }
  };

  BCSC.isLatestCommit = function (setToLatestCommit) {
    if (arguments.length) {
      BCSC.data.commit = keypather.get(BCSC.data.branch, 'commits.models[0]');
      BCSC.data.useLatest = setToLatestCommit;
      if (setToLatestCommit) {
        $scope.$emit('commit::selected', BCSC.data.commit);
      }
    } else {
      return BCSC.data.useLatest;
    }
  };

  BCSC.selectCommit = function (commit) {
    if (BCSC.data.useLatest) { return; }
    BCSC.data.commit = commit;
    $scope.$emit('commit::selected', commit);
  };

  BCSC.isAutoDeployOn = function () {
    return !keypather.get(BCSC.data.instance, 'attrs.locked');
  };

  BCSC.autoDeploy = function (isLocked) {
    var instance = keypather.get(BCSC, 'data.instance');
    if (angular.isDefined(isLocked)) {
      if ($rootScope.isLoading.autoDeploy) {
        return !isLocked;
      }
      loading('autoDeploy', true);
      return promisify(instance, 'update')({
        // We want to set auto-deploy on/off which is the opposite of the
        // `locked` property. Hence, set `!isLocked`
        locked: !isLocked
      })
        .catch(errs.handler)
        .then(function () {
          loading('autoDeploy', false);
        });
    }
    return BCSC.isAutoDeployOn();
  };

}
