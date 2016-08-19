'use strict';

require('app')
  .factory('isTabNameValid', isTabNameValid)
  .value('TAB_VISIBILITY', {
    repository:  {
      advanced: true,
      basic: true,
      mirror: true,
      step: 1
    },
    commands:  {
      basic: true,
      step: 2
    },
    ports:  {
      basic: true,
      step: 3
    },
    whitelist: {
      advanced: true,
      basic: true,
      mirror: true,
      nonRepo: true,
      step: 3
    },
    env:  {
      advanced: true,
      basic: true,
      mirror: true,
      nonRepo: true,
      step: 3
    },
    backup: {
      featureFlagName: 'backup',
      nonRepo: true,
      step: 3
    },
    files:  {
      basic: true,
      step: 3
    },
    translation:  {
      advanced: true,
      basic: true,
      step: 3
    },
    buildfiles: {
      basic: true,
      advanced: true,
      mirror: true,
      nonRepo: true,
      step: 3
    },
    logs: {
      advanced: true,
      basic: true,
      nonRepo: true,
      mirror: true,
      step: 4
    }
  });

function isTabNameValid (
  $rootScope,
  TAB_VISIBILITY
) {
  return function (tabName) {
    if (!TAB_VISIBILITY[tabName]) {
      return false;
    }
    if (TAB_VISIBILITY[tabName].featureFlagName && !$rootScope.featureFlags[TAB_VISIBILITY[tabName].featureFlagName]) {
      return false;
    }
    return true;
  };
}


