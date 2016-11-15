'use strict';

require('app')
  .factory('intercom', intercom);

function intercom(
  $window,
  $rootScope
) {
  $rootScope.$on('intercom::buildFailed', function () {
    $window.Intercom(
      'showNewMessage',
      'Fudge! This thing won’t build my container. Can you fix it?'
    );
  });
  $rootScope.$on('intercom::confirmedSetup', function () {
    $window.Intercom(
      'showNewMessage',
      'Hey! I need help setting up my application.'
    );
  });
  $rootScope.$on('intercom::migrating', function () {
    $window.Intercom(
      'showNewMessage',
      'Help! I’m having issues with migration.'
    );
  });
  $rootScope.$on('intercom::pawsd', function () {
    $window.Intercom(
      'showNewMessage',
      'Can you help me back into Runnable?'
    );
  });
  return {};
}
