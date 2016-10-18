'use strict';

require('app')
  .controller('GithubAuthController', GithubAuthController);

function GithubAuthController(
  $rootScope,
  $window,
  $location,
  eventTracking,
  keypather
) {
  var GAC = this;

  keypather.set($rootScope, 'dataApp', {});

  GAC.isInDemoFlow = $location.search().isDemo;

  GAC.actions = {
    confirmGitHub: function () {
      eventTracking.trackPrimer();
      $window.location = 'https://github.com/settings/connections/applications/d42d6634d4070c9d9bf9';
    }
  };
}
