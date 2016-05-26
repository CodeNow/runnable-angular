'use strict';

require('app')
  .controller('WelcomeBackController', WelcomeBackController);

function WelcomeBackController(
  $rootScope,
  booted
) {
  var WBC = this;

  $rootScope.dataApp = {};
  WBC.openIntercom = function () {
    window.Intercom(
      'showNewMessage',
      'I’m back! Please get my sandbox back up and running.'
    );
  };
}
