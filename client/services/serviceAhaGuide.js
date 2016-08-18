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
      ]
    },
    {
      title: 'Add your first Repository',
      subStepCaptions: [
        'Add your repository by clicking \'Add Configuration\'.',
        'Select a repository to configure',
        'How would you like to configure your repo?',
        'Give your repo a name.'
      ]
    }
  ]

  function getSteps() {
    return _steps;
  }

  return {
    getSteps: getSteps
  };
}
