'use strict';

require('app')
  .factory('serviceAhaGuide', serviceAhaGuide);

function serviceAhaGuide(

) {

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
      title: 'Add your first Repository',
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
          className: 'aha-meter-10'
        },
        containerSelection: {
          caption: 'Select a repository to configure',
          className: 'aha-meter-20'
        }, 
        dockerfileMirroring: {
          caption: 'How would you like to configure your repo?',
          className: 'aha-meter-30'
        }, 
        nameContainer: {
          caption: 'Give your configuration a name.',
          className: 'aha-meter-40'
        },
        repository: {
          caption: 'What does your repository run?',
          className: 'aha-meter-50'
        },
        commands: {
          caption: 'Choose commands and packages',
          className: 'aha-meter-60'
        },
        buildfiles: {
          caption: 'If your app needs additional configuration...',
          className: 'aha-meter-70'
        },
        default: {
          caption: 'If your app needs additional configuration...',
          className: 'aha-meter-70'
        },
        env: {
          caption: 'If your app needs additional configuration...',
          className: 'aha-meter-70'
        },
        files: {
          caption: 'If your app needs additional configuration...',
          className: 'aha-meter-70'
        },
        ports: {
          caption: 'If your app needs additional configuration...',
          className: 'aha-meter-70'
        },
        translation: {
          caption: 'If your app needs additional configuration...',
          className: 'aha-meter-70'
        },
        logs: {
          caption: 'Now building. Build time varies depending on your configuration',
          className: 'aha-meter-80'
        },
        success: {
          caption: 'Your build is looking good! Check out its URL and click \'Done\' if it looks good',
          className: 'aha-meter-90'
        }
      },

      buildStatus: {
        running: 'Verifying configuration... ',
        success: 'Your build is looking good! Check out its URL and click \'Done\' if it looks good',
        faileda: 'Your container failed to run. Inspect your CMD logs for more information.',
        failed: 'Your build failed. Inspect your build logs for more information.'
      },

      panelSteps: {
        containerSelection: 1,
        dockerfileMirroring: 2,
        nameContainer: 3
      },

      tabSteps: {
        repository: 4,
        commands: 5,
        buildfiles: 6,
        default: 6,
        env: 6,
        files: 6,
        ports: 6,
        translation: 6,
        logs: 7,
        success: 8
      }
    }
  ]

  function getSteps() {
    return _steps;
  }

  return {
    getSteps: getSteps
  };
}
