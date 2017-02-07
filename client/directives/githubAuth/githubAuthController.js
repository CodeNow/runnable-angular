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
    },
    clickedToAuthDocs: function () {
      eventTracking.clickedToAuthDocs();
    }
  };
}
