'use strict';

require('app')
  .factory('ahaGuide', ahaGuide);

var STEPS = {
  CHOOSE_ORGANIZATION: 1,
  ADD_FIRST_REPO: 2,
  ADD_FIRST_BRANCH: 3,
  SETUP_RUNNABOT: 4,
  COMPLETED: -1
};

function ahaGuide(
  $rootScope,
  currentOrg,
  eventTracking,
  fetchInstancesByPod,
  isRunnabotPartOfOrg,
  keypather,
  patchOrgMetadata
) {
  var instances = [];
  var hasRunnabot = false;
  function refreshInstances() {
    return fetchInstancesByPod()
      .then(function (fetchedInstances) {
        instances = fetchedInstances;
      });
  }
  function refreshHasRunnabot() {
    if (hasRunnabot) { return true; }
    return isRunnabotPartOfOrg(keypather.get(currentOrg, 'github.attrs.login'))
      .then(function (runnabot) {
        if (runnabot && isInGuide()) {
          endGuide()
            .then(function() {
              $rootScope.$broadcast('showAutoLaunchPopover');
              eventTracking.invitedRunnabot();
            });
        }
        hasRunnabot = runnabot;
        return hasRunnabot;
      });
  }

  refreshInstances();
  refreshHasRunnabot();
  eventTracking.updateCurrentPersonProfile(getCurrentStep());

  var stepList = {};
  stepList[STEPS.CHOOSE_ORGANIZATION] = {
    title: 'Step 1: Choose your Organization',
    subSteps: {
      orgSelection: {
        caption: 'Select the organization you want to use with Runnable.',
        className: 'aha-meter-33'
      },
      dockLoading: {
        caption: 'Bear with us!',
        className: 'aha-meter-66'
      },
      dockLoaded: {
        caption: 'Continue to start configuring your project.',
        className: 'aha-meter-100'
      }
    },
    panelSteps: {
      orgSelection: 0,
      dockLoading: 1,
      dockLoaded: 2
    },
    defaultSubstep: 'orgSelection'
  };

  stepList[STEPS.ADD_FIRST_REPO] = {
    title: 'Step 2: Configure your Application',
    subSteps: {
      addRepository: {
        className: 'aha-meter-11',
        step: 0,
        value: 10
      },
      containerSelection: {
        className: 'aha-meter-22',
        step: 1,
        value: 20
      },
      dockerfileMirroring: {
        className: 'aha-meter-33',
        step: 2,
        value: 30
      },
      nameContainer: {
        className: 'aha-meter-44',
        step: 3,
        value: 40
      },
      repository: {
        className: 'aha-meter-55',
        step: 4,
        value: 50
      },
      commands: {
        className: 'aha-meter-66',
        step: 5,
        value: 60
      },
      buildfiles: {
        className: 'aha-meter-77',
        step: 6,
        value: 70
      },
      default: {
        className: 'aha-meter-77',
        step: 6,
        value: 70
      },
      env: {
        className: 'aha-meter-77',
        step: 6,
        value: 70
      },
      files: {
        className: 'aha-meter-77',
        step: 6,
        value: 70
      },
      filesMirror: {
        className: 'aha-meter-77',
        step: 6,
        value: 70
      },
      ports: {
        className: 'aha-meter-77',
        step: 6,
        value: 70
      },
      translation: {
        className: 'aha-meter-77',
        step: 6,
        value: 70
      },
      logs: {
        className: 'aha-meter-88',
        step: 7,
        value: 80
      },
      exitedEarly: {
        className: 'aha-meter-88',
        step: 7,
        value: 80
      },
      success: {
        className: 'aha-meter-100',
        step: 8,
        value: 90
      },
      complete: {
        className: 'aha-meter-100',
        step: 9,
        value: 100
      }
    },
    buildStatus: {
      building: 'We‘re building! Build time varies depending on your build commands.',
      starting: 'We‘re building! Build time varies depending on your build commands.',
      running: 'Looking good! Check out your URL, and click ‘Done’ if it looks good to you too.',
      stopped: 'Your template isn‘t running yet! Check the logs to debug any issues. If you‘re stumped, ask our engineers!',
      cmdFailed: 'Your template isn‘t running yet! Check the logs to debug any issues. If you‘re stumped, ask our engineers!',
      crashed: 'Your template isn‘t running yet! Check the logs to debug any issues. If you‘re stumped, ask our engineers!',
      buildFailed: 'Your template isn‘t running yet! Check the logs to debug any issues. If you‘re stumped, ask our engineers!'
    },
    configSubsteps: ['default', 'env', 'files', 'ports', 'translation'],
    defaultSubstep: 'addRepository'
  };

  stepList[STEPS.ADD_FIRST_BRANCH] = {
    title: 'Step 3: Add a Branch',
    subSteps: {
      addBranch: {
        caption: 'Almost done! Click the + button next to a repo name to add a branch.',
        className: 'aha-meter-33',
        value: 33
      },
      selectBranch: {
        className: 'aha-meter-66',
        value: 66
      },
      noBranches: {
        className: 'aha-meter-100',
        value: 100
      },
      deletedTemplate: {
        caption: 'You\'ve deleted your repository template. Create another one to continue.',
        className: 'aha-meter-20',
        value: -1
      }
    },
    panelSteps: { },
    defaultSubstep: 'addBranch'
  };

  stepList[STEPS.SETUP_RUNNABOT] = {
    subSteps: {
      setupRunnabot: {
        caption: 'Get the most out of Runnabot by adding branches automatically',
        className: 'aha-meter-50'
      }
    }
  };

  var cachedSubstep = {};

/**
 * Furthest Substep getter/setter
 *
 * When setting the substep, the new subStep must have a value greater than the previous step to
 * be updated
 *
 * @param step       {Number} Which step to reference when looking at the substep
 * @param newSubstep {String} new substep to go to
 * @returns          {String} substep currently on
 */
  function furthestSubstep(step, newSubstep) {
    if (!step) {
      return;
    }
    if (arguments.length > 1) {
      if (!cachedSubstep[step]) {
        cachedSubstep[step] = newSubstep;
      } else {
        var newStepValue = keypather.get(stepList[step], 'subSteps.' + newSubstep + '.value');
        var oldSubstepValue = keypather.get(stepList[step], 'subSteps.' + cachedSubstep[step] + '.value');
        if (newStepValue === -1 || newStepValue > oldSubstepValue) {
          // automatically allow switch when an error state
          cachedSubstep[step] = newSubstep;
          updateTracking(newSubstep);
        }
      }
    }
    return cachedSubstep[step] || stepList[step].defaultSubstep;
  }

  var cachedStep;
  $rootScope.$watch(function () {
    cachedStep = null;
  });
  $rootScope.$on('$stateChangeSuccess', function () {
    refreshInstances();
    refreshHasRunnabot();
  });
  function getCurrentStep() {
    if (!cachedStep) {
      if (keypather.get($rootScope, 'featureFlags.aha') && !keypather.get(currentOrg, 'poppa.id')) {
        cachedStep = STEPS.CHOOSE_ORGANIZATION;
      } else if (!isInGuide()) {
        cachedStep = STEPS.COMPLETED;
      } else if (!hasConfirmedSetup()) {
        cachedStep = STEPS.ADD_FIRST_REPO;
      } else {
        // loop over instances and see if any has ever had a branch launched
        var hasBranchLaunched = false;
        if (keypather.get(instances, 'models.length')) {
          instances.models.some(function (instance) {
            hasBranchLaunched = instance.attrs.hasAddedBranches || keypather.get(instance, 'children.models.length');
            return hasBranchLaunched;
          });
        }
        if (!hasBranchLaunched && !ahaGuide.skippedBranchMilestone) {
          cachedStep = STEPS.ADD_FIRST_BRANCH;
        } else if (!hasRunnabot) {
          cachedStep = STEPS.SETUP_RUNNABOT;
        } else {
          cachedStep = STEPS.COMPLETED;
        }
      }
    }
    return cachedStep;
  }

  function getClassForSubstep (errorState) {
    var step = furthestSubstep(STEPS.ADD_FIRST_REPO);
    var progressDial = stepList[STEPS.ADD_FIRST_REPO].subSteps[step].className;
    var classNames = [];
    if (errorState) {
      classNames.push('aha-error');
    }
    if (progressDial) {
      classNames.push(progressDial);
    }
    return classNames;
  }

  function isInGuide () {
    return true;
    // return keypather.get(currentOrg, 'poppa.attrs.metadata.hasAha');
  }

  function hasConfirmedSetup () {
    return keypather.get(currentOrg, 'poppa.attrs.metadata.hasConfirmedSetup');
  }

  function updateCurrentOrg (updatedOrg) {
    if (keypather.has(updatedOrg, 'metadata.hasAha') && keypather.has(updatedOrg, 'metadata.hasConfirmedSetup')) {
      currentOrg.poppa.attrs.metadata = updatedOrg.metadata;
    }
  }

  function skipBranchMilestone () {
    ahaGuide.skippedBranchMilestone = true;
    $rootScope.$broadcast('showAhaSidebar');
  }

  function endGuide () {
    $rootScope.$broadcast('close-popovers');
    return patchOrgMetadata(currentOrg.poppa.id(), {
      metadata: {
        hasAha: false
      }
    })
      .then(function (updatedOrg) {
        updateCurrentOrg(updatedOrg);
      });
  }

  function resetGuide() {
    return patchOrgMetadata(currentOrg.poppa.id(), {
      metadata: {
        hasAha: true,
        hasConfirmedSetup: false
      }
    })
      .then(function (updatedOrg) {
        updateCurrentOrg(updatedOrg);
      });
  }

  function updateTracking(step) {
    var currentStep = getCurrentStep();
    switch (step) {
      case 'containerSelection':
        eventTracking.milestone2SelectTemplate();
        break;
      case 'repository':
        eventTracking.milestone2VerifyRepositoryTab();
        break;
      case 'commands':
        eventTracking.milestone2VerifyCommandsTab();
        break;
      case 'logs':
        eventTracking.milestone2Building();
        break;
      case 'success':
        eventTracking.milestone2BuildSuccess();
        break;
      default:
        if (currentStep === 4) {
          eventTracking.milestone3AddedBranch();
        }
    }
    eventTracking.updateCurrentPersonProfile(currentStep);
  }

  return {
    endGuide: endGuide,
    resetGuide: resetGuide,
    getCurrentStep: getCurrentStep,
    getClassForSubstep: getClassForSubstep,
    hasConfirmedSetup: hasConfirmedSetup,
    hasRunnabot: refreshHasRunnabot,
    isInGuide: isInGuide,
    stepList: stepList,
    steps: STEPS,
    updateCurrentOrg: updateCurrentOrg,
    furthestSubstep: furthestSubstep,
    updateTracking: updateTracking,
    skipBranchMilestone: skipBranchMilestone,
    isChoosingOrg: function() {
      return getCurrentStep() === STEPS.CHOOSE_ORGANIZATION;
    },
    isAddingFirstRepo: function () {
      return getCurrentStep() === STEPS.ADD_FIRST_REPO;
    },
    isAddingFirstBranch: function() {
      return getCurrentStep() === STEPS.ADD_FIRST_BRANCH;
    },
    isSettingUpRunnabot: function() {
      return getCurrentStep() === STEPS.SETUP_RUNNABOT && !hasRunnabot;
    }
  };
}
