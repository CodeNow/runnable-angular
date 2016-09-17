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
  fetchInstancesByPod,
  keypather,
  patchOrgMetadata
) {
  var instances = [];
  function refreshInstances() {
    return fetchInstancesByPod()
      .then(function (fetchedInstances) {
        instances = fetchedInstances.models;
      });
  }
  refreshInstances();

  var stepList = {};
  stepList[STEPS.CHOOSE_ORGANIZATION] = {
    title: 'Create your Environment',
    subSteps: {
      orgSelection: {
        caption: 'Choose an organization to create your sandbox for.',
        className: 'aha-meter-33'
      },
      dockLoading: {
        caption: 'Hang tight!',
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
    }
  };
  stepList[STEPS.ADD_FIRST_REPO] = {
    title: 'Add your First Repository',
    subSteps: {
      addRepository: {
        className: 'aha-meter-10',
        step: 0
      },
      containerSelection: {
        className: 'aha-meter-20',
        step: 1
      },
      dockerfileMirroring: {
        className: 'aha-meter-30',
        step: 2
      },
      nameContainer: {
        className: 'aha-meter-40',
        step: 3
      },
      repository: {
        className: 'aha-meter-50',
        step: 4
      },
      commands: {
        className: 'aha-meter-60',
        step: 5
      },
      buildfiles: {
        className: 'aha-meter-70',
        step: 6
      },
      default: {
        className: 'aha-meter-70',
        step: 6
      },
      env: {
        className: 'aha-meter-70',
        step: 6
      },
      files: {
        className: 'aha-meter-70',
        step: 6
      },
      filesMirror: {
        className: 'aha-meter-70',
        step: 6
      },
      ports: {
        className: 'aha-meter-70',
        step: 6
      },
      translation: {
        className: 'aha-meter-70',
        step: 6
      },
      logs: {
        className: 'aha-meter-80',
        step: 7
      },
      exitedEarly: {
        className: 'aha-meter-80',
        step: 7
      },
      success: {
        className: 'aha-meter-90',
        step: 8
      },
      complete: {
        className: 'aha-meter-100',
        step: 9
      }
    },
    buildStatus: {
      building: 'We‘re building! Build time varies depending on your template.',
      starting: 'We‘re building! Build time varies depending on your template.',
      running: 'Looking good! Check out your URL, and click ‘Done’ if it looks good to you too.',
      stopped: 'Your template isn‘t running yet! Check the logs to debug any issues. If you‘re stumped, ask our engineers!',
      cmdFailed: 'Your template isn‘t running yet! Check the logs to debug any issues. If you‘re stumped, ask our engineers!',
      crashed: 'Your template isn‘t running yet! Check the logs to debug any issues. If you‘re stumped, ask our engineers!',
      buildFailed: 'Your template isn‘t running yet! Check the logs to debug any issues. If you‘re stumped, ask our engineers!'
    }
  };

  stepList[STEPS.ADD_FIRST_BRANCH] = {
    title: 'Add your First Branch',
    subSteps: {
      addBranch: {
        caption: 'Almost done! Click the + button next to a repo name to add a branch.',
        className: 'aha-meter-33'
      },
      dockLoading: {
        caption: 'Hang tight!',
        className: 'aha-meter-66'
      },
      dockLoaded: {
        caption: 'Continue to start configuring your project.',
        className: 'aha-meter-100'
      },
      deletedTemplate: {
        caption: 'You\'ve deleted your repository template. Create another one to continue.',
        className: 'aha-meter-20'
      }
    },
    panelSteps: { }
  };

  stepList[STEPS.SETUP_RUNNABOT] = {
    subSteps: {
      setupRunnabot: {
        caption: 'Get the most out of Runnabot by adding branches automatically',
        className: 'aha-meter-50'
      }
    }
  };

  var cachedStep;
  $rootScope.$watch(function () {
    cachedStep = null;
  });
  $rootScope.$on('$stateChangeSuccess', function () {
    refreshInstances();
  });
  function getCurrentStep() {
    if (!cachedStep) {
      if ($rootScope.featureFlags.aha && !keypather.get(currentOrg, 'poppa.id')) {
        cachedStep = STEPS.CHOOSE_ORGANIZATION;
      } else if (!$rootScope.featureFlags.aha || !isInGuide()) {
        cachedStep = STEPS.COMPLETED;
      } else if (!hasConfirmedSetup()) {
        cachedStep = STEPS.ADD_FIRST_REPO;
      } else {
        // loop over instances and see if any has ever had a branch launched
        var hasBranchLaunched = instances.some(function (instance) {
          return instance.attrs.hasAddedBranches;
        });
        if (hasBranchLaunched) {
          cachedStep = STEPS.SETUP_RUNNABOT;
        } else {
          cachedStep = STEPS.ADD_FIRST_BRANCH;
        }
      }
    }
    return cachedStep;
  }

  function isInGuide () {
    return keypather.get(currentOrg, 'poppa.attrs.metadata.hasAha');
  }

  function hasConfirmedSetup () {
    return keypather.get(currentOrg, 'poppa.attrs.metadata.hasConfirmedSetup');
  }

  function updateCurrentOrg(updatedOrg) {
    if (keypather.has(updatedOrg, 'metadata.hasAha') && keypather.has(updatedOrg, 'metadata.hasConfirmedSetup')) {
      currentOrg.poppa.attrs.metadata = updatedOrg.metadata;
    }
  }

  function endGuide () {
    $rootScope.$broadcast('close-popovers');
    return patchOrgMetadata(currentOrg.poppa.id(), {
      metadata: {
        hasAha: false
      }
    })
    .then(function(updatedOrg) {
      updateCurrentOrg(updatedOrg);
    });
  }

  return {
    endGuide: endGuide,
    getCurrentStep: getCurrentStep,
    hasConfirmedSetup: hasConfirmedSetup,
    isInGuide: isInGuide,
    stepList: stepList,
    steps: STEPS,
    updateCurrentOrg: updateCurrentOrg,
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
      return getCurrentStep() === STEPS.SETUP_RUNNABOT;
    },
  };
}
