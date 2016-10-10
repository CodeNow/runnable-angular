'use strict';

require('app')
  .controller('GithubAuthController', GithubAuthController);

function GithubAuthController(
  $rootScope,
  $window,
  eventTracking,
  keypather
) {
  var GAC = this;

  keypather.set($rootScope, 'dataApp', {});

  GAC.actions = {
    confirmGitHub: function () {
      eventTracking.trackPrimer();
      $window.location = 'https://github.com/settings/connections/applications/d42d6634d4070c9d9bf9';
    }
  };
}
