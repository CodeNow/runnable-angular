'use strict';

require('app')
  .controller('BranchCommitSelectorController', BranchCommitSelectorController);

function BranchCommitSelectorController(
  $scope,
  eventTracking,
  keypather
) {
  var BCSC = this;
  BCSC.isLatestCommitDeployed = true;
  BCSC.eventTracking = eventTracking;

  BCSC.onCommitFetch = function (commits) {
    if (!commits.models.length) { return; }
    if (BCSC.data.commit) {
      BCSC.data.commit = commits.models.find(function (otherCommits) {
        return otherCommits === BCSC.data.commit;
      }) || commits.models[0];
      BCSC.isLatestCommitDeployed = commits.models[0] === BCSC.data.commit;
    }
  };

  /**
   * Tells you if the useLatest flag is set.
   * if setTolatestCommit is truthy it sets the build to use the latest commit and sets useLatest to true.
   *
   * @param setToLatestCommit: Force the selection to the latest commit
   */
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

  BCSC.selectCommit = function (commit, isLatestCommit) {
    eventTracking.selectCommit(isLatestCommit);
    if (BCSC.isAutoDeployOn() || BCSC.isLatestCommit()) { return; }
    BCSC.data.commit = commit;
    $scope.$emit('commit::selected', commit);
  };

  BCSC.deployLatestCommit = function () {
    if (BCSC.isAutoDeployOn() && !BCSC.isLatestCommitDeployed) {
      BCSC.data.commit = keypather.get(BCSC.data.branch, 'commits.models[0]');
      BCSC.updateInstance();
    }
  };

  BCSC.isAutoDeployOn = function () {
    if (keypather.get(BCSC, 'data.acv.attrs.additionalRepo')) {
      return BCSC.data.useLatest;
    }
    return !keypather.get(BCSC.data, 'locked');
  };

  BCSC.autoDeploy = function (isAutoDeployOn) {
    if (angular.isDefined(isAutoDeployOn)) {
      BCSC.data.locked = !isAutoDeployOn;

      if (isAutoDeployOn) {
        BCSC.isLatestCommit(true);
      }
    }
    return BCSC.isAutoDeployOn();
  };

}
