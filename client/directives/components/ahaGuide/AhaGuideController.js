
'use strict';

require('app')
  .controller('AhaGuideController', AhaGuideController);

function AhaGuideController(
  $scope,
  $rootScope,
  ahaGuide,
  currentOrg
) {

  var AGC = this;

  var alertListener = $scope.$on('alert', function(event, alert) {
    // alerts on container creation success
    if (alert.type === 'success') {
      updateCaption('logs');
      alertListener();
    }
  });

  var buildLogListener = $scope.$on('buildStatusUpdated', function(event, buildStatus) {
    handleBuildUpdate(buildStatus);
  });

  var tabListener = $scope.$on('updatedTab', function(event, tabName) {
    if (AGC.subStepIndex > 5) {
      tabListener();
    } else {
      updateCaption(tabName);
    }
  });

  AGC.isBuildSuccessful = false;
  AGC.ahaGuide = ahaGuide;

  // get the current milestone
  var currentMilestone = ahaGuide.stepList[ahaGuide.getCurrentStep()];

  AGC.title = currentMilestone.title;
  AGC.caption = currentMilestone.subSteps[AGC.subStep].caption;
  AGC.className = currentMilestone.subSteps[AGC.subStep].className;

  // update steps and initiate digest loop
  function updateCaption(status) {
    if (!currentMilestone.subSteps[status]) {
      return;
    }
    if (status === 'dockLoaded') {
      $rootScope.animatedPanelListener();
    }
    AGC.subStep = status;
    AGC.subStepIndex = currentMilestone.subSteps[status].step;
    AGC.caption = currentMilestone.subSteps[status].caption;
    AGC.className = currentMilestone.subSteps[status].className;
  }

  function handleBuildUpdate(update) {
    var buildStatus = update.status;
    if (buildStatus === 'buildFailed' || buildStatus === 'stopped' || buildStatus === 'crashed') {
      AGC.showError = true;
    } else if (buildStatus === 'starting') {
      AGC.showError = false;
    } else if (buildStatus === 'running') {
        AGC.isBuildSuccessful = true;
        updateCaption('success');
        $rootScope.$broadcast('exitedEarly', false);
    }
    updateBuildStatus(buildStatus);
  }

  function updateBuildStatus(buildStatus) {
    AGC.buildStatus = buildStatus;
    AGC.caption = currentMilestone.buildStatus[buildStatus] || AGC.caption;
  }

  // we need to unregister this animated panel listener if it exists
  // to avoid duplication
  if ($rootScope.animatedPanelListener) {
    $rootScope.animatedPanelListener();
  }

  $scope.$on('$destroy', function() {
    if ($rootScope.animatedPanelListener) {
      $rootScope.animatedPanelListener();
    }
    if ($rootScope.doneListener) {
      $rootScope.doneListener();
    }
    if (AGC.subStepIndex === 7 && !AGC.isBuildSuccessful) {
      $rootScope.$broadcast('exitedEarly', true);
    }
  });

  $rootScope.animatedPanelListener = $rootScope.$on('changed-animated-panel', function (e, panel) {
    updateCaption(panel);
  });

  AGC.popoverActions = {
    endGuide: function () {
      $rootScope.$broadcast('close-popovers');
      // TODO: AHA - Make this save
      currentOrg.poppa.hasAha = false;
    },
    showSidebar: function () {
      $rootScope.$broadcast('close-popovers');
      $rootScope.$broadcast('show-aha-sidebar');
    }
  };
}
