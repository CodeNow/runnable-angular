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
  keypather
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
    title: 'Create your Sandbox',
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
        caption: 'Add your repository by clicking ‘Add Configuration’.',
        className: 'aha-meter-10',
        step: 0
      },
      containerSelection: {
        caption: 'Select a repository to configure.',
        className: 'aha-meter-20',
        step: 1
      },
      dockerfileMirroring: {
        caption: 'How would you like to configure your repo?',
        className: 'aha-meter-30',
        step: 2
      },
      nameContainer: {
        caption: 'Give your configuration a name.',
        className: 'aha-meter-40',
        step: 3
      },
      repository: {
        caption: 'What does your repository run?',
        className: 'aha-meter-50',
        step: 4
      },
      commands: {
        caption: 'Choose commands and packages.',
        className: 'aha-meter-60',
        step: 5
      },
      buildfiles: {
        caption: 'If your app needs additional configuration…',
        className: 'aha-meter-70',
        step: 6
      },
      default: {
        caption: 'If your app needs additional configuration…',
        className: 'aha-meter-70',
        step: 6
      },
      env: {
        caption: 'If your app needs additional configuration…',
        className: 'aha-meter-70',
        step: 6
      },
      files: {
        caption: 'If your app needs additional configuration…',
        className: 'aha-meter-70',
        step: 6
      },
      filesMirror: {
        caption: 'We’ve imported your dockerfile, click ‘Save & Build’ to build it!',
        className: 'aha-meter-70',
        step: 6
      },
      ports: {
        caption: 'If your app needs additional configuration…',
        className: 'aha-meter-70',
        step: 6
      },
      translation: {
        caption: 'If your app needs additional configuration…',
        className: 'aha-meter-70',
        step: 6
      },
      logs: {
        caption: 'We‘re building! Build time varies depending on your template.',
        className: 'aha-meter-80',
        step: 7
      },
      exitedEarly: {
        caption: 'Your template isn‘t running yet! Check the logs to debug any issues. If you‘re stumped, ask our engineers!',
        className: 'aha-meter-80',
        step: 7,
        errorState: true
      },
      success: {
        caption: 'Looking good! Check out your URL, and click ‘Done’ if it looks good to you too.',
        className: 'aha-meter-90',
        step: 8
      },
      complete: {
        caption: 'Add more templates if your project requires it. Once you’re done, head to your containers to start adding branches.',
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
      }
    },
    panelSteps: { }
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
      } else if (!$rootScope.featureFlags.aha || !currentOrg.poppa.hasAha) {
        cachedStep = STEPS.COMPLETED;
      } else if (!currentOrg.poppa.hasConfirmedSetup) {
        cachedStep = STEPS.ADD_FIRST_REPO;
      } else {
        // loop over instances and see if any has ever had a branch launched
        var hasBranchLaunched = instances.some(function (instance) {
          return instance.attrs.hasBranchLaunched;
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

  function isInGuide() {
    return $rootScope.featureFlags.aha && currentOrg.poppa.hasAha && getCurrentStep() !== STEPS.COMPLETED;
  }

  return {
    stepList: stepList,
    getCurrentStep: getCurrentStep,
    steps: STEPS,
    isInGuide: isInGuide
  };
}
