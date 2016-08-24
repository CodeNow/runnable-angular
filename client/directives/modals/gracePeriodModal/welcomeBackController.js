'use strict';

require('app')
  .controller('WelcomeBackController', WelcomeBackController);

function WelcomeBackController(
  $rootScope
) {
  var WBC = this;
  WBC.close = angular.noop;

  $rootScope.dataApp.gracePeriod = true;
  WBC.openIntercom = function () {
    window.Intercom(
      'showNewMessage',
      'I’m back! Help me get my containers back up and running.'
    );
  };
}
