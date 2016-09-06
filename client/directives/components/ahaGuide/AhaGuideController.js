
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
    if (AGC.state.subStepIndex > 5) {
      tabListener();
    } else {
      updateCaption(tabName);
    }
  });

  AGC.ahaGuide = ahaGuide;
  AGC.state = {
    hideMenu: false,
    isBuildSuccessful: false,
    mainStep: $scope.stepIndex,
    subStep: $scope.subStep,
    subStepIndex: $scope.subStepIndex,
    showError: $scope.errorState
  };

  // get steps from service
  AGC.state.steps = ahaGuide.stepList;

  // get the current milestone
  var currentMilestone = AGC.state.steps[AGC.state.mainStep];
  // get the bound of the caption array so we know when to stop

  AGC.state.title = currentMilestone.title;
  AGC.state.caption = currentMilestone.subSteps[AGC.state.subStep].caption;
  AGC.state.className = currentMilestone.subSteps[AGC.state.subStep].className;

  // update steps and initiate digest loop
  function updateCaption(status) {
    if (!currentMilestone.subSteps[status]) {
      return;
    }
    if (status === 'dockLoaded') {
      $rootScope.animatedPanelListener();
    }
    AGC.state.subStep = status;
    AGC.state.subStepIndex = currentMilestone.subSteps[status].step;
    AGC.state.caption = currentMilestone.subSteps[status].caption;
    AGC.state.className = currentMilestone.subSteps[status].className;

    // not animating
    // var thingy = angular.element(document.getElementsByClassName('p-slide'))
    // var parentThingy = angular.element(document.getElementsByClassName('grid-block aha-text'))

    // if (thingy && parentThingy) {
    //   thingy.remove();
    //   parentThingy.append('<p ng-class="{\'p-slide js-animate\': AGC.state.subStepIndex}" ng-if="$root.featureFlags.aha &amp;&amp;\
    //                       !state.showError &amp;&amp; !state.showVerification" class="p ng-binding ng-scope p-slide js-animate">' +
    //                       AGC.state.caption + '</p>');
    // }
  }

  function handleBuildUpdate(update) {
    console.log(update);
    var buildStatus = update.status;
    if (buildStatus === 'buildFailed' || buildStatus === 'stopped' || buildStatus === 'crashed') {
      AGC.state.showError = true;
    } else if (buildStatus === 'starting') {
      AGC.state.showError = false;
    } else if (buildStatus === 'running') {
        AGC.state.isBuildSuccessful = true;
        updateCaption('success');
        $rootScope.$broadcast('exitedEarly', false);
    }
    updateBuildStatus(buildStatus);
  }

  function updateBuildStatus(buildStatus) {
    AGC.state.buildStatus = buildStatus;
    AGC.state.caption = currentMilestone.buildStatus[buildStatus] || AGC.state.caption;
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
    if (AGC.state.subStepIndex === 7 && !AGC.state.isBuildSuccessful) {
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
