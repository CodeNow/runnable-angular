'use strict';

require('app')
  .factory('serviceAhaGuide', serviceAhaGuide);

function serviceAhaGuide(
  $http,
  $localStorage,
  keypather
) {

  var ahaService = this;
  var ahaMilestonesComplete;
  var _state;

  ahaMilestonesComplete = getAhaMilestones();

  var _steps = [
    {
      title: 'Create your Sandbox',
      subStepCaptions: [
        'Choose an organization to create your sandbox for.',
        'Hang tight!',
        'Continue to start configuring your project.'
      ],
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
        },
      },
      panelSteps: {
        orgSelection: 0,
        dockLoading: 1,
        dockLoaded: 2
      }
    },
    {
      title: 'Add your First Repository',
      subStepCaptions: [
        'Add your repository by clicking \'Add Configuration\'.',
        'Select a repository to configure',
        'How would you like to configure your repo?',
        'Give your configuration a name.',
        'What does your repository run?',
        'Choose commands and packages',
        'If your app needs additional configuration...',
        'Now building. Build times varies depending on your configuration',
        'Your build is looking good! Check out its url and click \'Done\' if it looks good to you.'
      ],
      subSteps: {
        addRepository: {
          caption: 'Add your repository by clicking \'Add Configuration\'.',
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
          caption: 'Choose commands and packages',
          className: 'aha-meter-60',
          step: 5
        },
        buildfiles: {
          caption: 'If your app needs additional configuration...',
          className: 'aha-meter-70',
          step: 6
        },
        default: {
          caption: 'If your app needs additional configuration...',
          className: 'aha-meter-70',
          step: 6
        },
        env: {
          caption: 'If your app needs additional configuration...',
          className: 'aha-meter-70',
          step: 6
        },
        files: {
          caption: 'If your app needs additional configuration...',
          className: 'aha-meter-70',
          step: 6
        },
        filesMirror: {
          caption: 'We\'ve imported your dockerfile, click \'Save & Build\' to build it!',
          className: 'aha-meter-70',
          step: 6
        },
        ports: {
          caption: 'If your app needs additional configuration...',
          className: 'aha-meter-70',
          step: 6
        },
        translation: {
          caption: 'If your app needs additional configuration...',
          className: 'aha-meter-70',
          step: 6
        },
        logs: {
          caption: 'Now building. Build time varies depending on your configuration',
          className: 'aha-meter-80',
          step: 7
        },
        exitedEarly: {
          caption: 'Your container isn\'t running yet! Check the logs to debug any issues. If you\'re stumped, ask our engineers!',
          className: 'aha-meter-80',
          step: 7,
          errorState: true
        },
        success: {
          caption: 'Your build is looking good! Check out its URL and click \'Done\' if it looks good',
          className: 'aha-meter-90',
          step: 8
        },
        complete: {
          caption: 'Add more containers if your project requires it. Once you\'re done, head to your containers to start adding branches.',
          className: 'aha-meter-100',
          step: 9
        }
      },

      buildStatus: {
        building: 'Now building. Build time varies depending on your configuration',
        running: 'Verifying configuration... ',
        starting: 'Now building. Build time varies depending on your configuration',
        success: 'Your build is looking good! Check out its URL and click \'Done\' if it looks good',
        stopped: 'Your container failed to run. Inspect your CMD logs for more information.',
        cmdFailed: 'Your container failed to run. Inspect your CMD logs for more information.',
        crashed: 'Your container failed to run. Inspect your CMD logs for more information.',
        buildFailed: 'Your build failed. Inspect your build logs for more information.'
      }
    }
  ];

  function getSteps() {
    return _steps;
  }

  function checkContainerStatus(url) {
    ahaService.pendingRequest = true;
    return $http({
      method: 'GET',
      url: url
    })
      .then(function(data) {
        ahaService.pendingRequest = false;
        if (data.status >= 200 && data.status < 300) {
          return true;
        }
        return false;
       })
       .catch(function(err) {
        console.log(err);
        return new Error(err);
      });
  }

  function isComplete(step, bool) {
    if (bool === true) {
      keypather.set($localStorage, 'completedMilestones.' + step, true);
      ahaMilestonesComplete[step] = bool;
    } else {
      return keypather.get($localStorage, 'completedMilestones.' + step);
    }
  }

  function getAhaMilestones() {
    var ahaMilestones = keypather.get($localStorage, 'completedMilestones');
    if (!ahaMilestones) {
      ahaMilestones = {
        aha0: false,
        aha1: false,
        aha2: false,
        aha3: false
      };
      keypather.set($localStorage, 'completedMilestones', ahaMilestones);
    }

    return ahaMilestones;
  }

  function setState(state) {
    _state = angular.extend({}, state);
    return _state;
  }

  function getState() {
    return _state;
  }

  return {
    checkContainerStatus: checkContainerStatus,
    getAhaMilestones: getAhaMilestones,
    getSteps: getSteps,
    isComplete: isComplete
  };
}
