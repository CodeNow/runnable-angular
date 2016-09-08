
'use strict';

require('app')
  .controller('AhaGuideController', AhaGuideController);

function AhaGuideController(
  $scope,
  $rootScope,
  ahaGuide,
  currentOrg,
  fetchInstancesByPod,
  keypather
) {
  var AGC = this;
  var animatedPanelListener = angular.noop;

  AGC.instances = null;
  fetchInstancesByPod()
    .then(function (instances) {
      AGC.instances = instances;
      updateCaption(AGC.subStep);
    });

  var alertListener = $scope.$on('alert', function (event, alert) {
    // alerts on container creation success
    if (alert.type === 'success') {
      updateCaption('logs');
      alertListener();
    }
  });

  $scope.$on('buildStatusUpdated', function (event, buildStatus) {
    handleBuildUpdate(buildStatus);
  });

  var stopTabUpdate = $scope.$on('updatedTab', function(event, tabName) {
    if (AGC.subStepIndex > 5) {
      stopTabUpdate();
    } else {
      updateCaption(tabName);
    }
  });

  AGC.isBuildSuccessful = false;
  AGC.ahaGuide = ahaGuide;

  // get the current milestone
  var currentMilestone = ahaGuide.stepList[ahaGuide.getCurrentStep()];

  AGC.title = currentMilestone.title;
  updateCaption(AGC.subStep);

  // update steps and initiate digest loop
  function updateCaption(status) {
    if (!currentMilestone.subSteps[status]) {
      return;
    }
    if (status === 'dockLoaded') {
      animatedPanelListener();
    }
    if (ahaGuide.getCurrentStep() === ahaGuide.steps.ADD_FIRST_REPO && keypather.get(AGC, 'instances.models.length') > 0 && status !== 'complete') {
      status = 'hasContainer';
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
    AGC.buildStatus = buildStatus;
    AGC.caption = currentMilestone.buildStatus[buildStatus] || AGC.caption;
  }

  $scope.$on('$destroy', function () {
    animatedPanelListener();
    if (AGC.subStepIndex === 7 && !AGC.isBuildSuccessful) {
      $rootScope.$broadcast('exitedEarly', true);
    }
  });

  animatedPanelListener = $rootScope.$on('changed-animated-panel', function (e, panel) {
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
