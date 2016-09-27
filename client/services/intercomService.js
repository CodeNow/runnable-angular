'use strict';

require('app')
  .factory('intercom', intercom);

function intercom(
  $window,
  $rootScope
) {
  console.log('intercom attaching');
  $rootScope.$on('intercom::buildFailed', function () {
    console.log('intercom::buildFailed');
    $window.Intercom(
      'showNewMessage',
      'Fudge! This thing won’t build my container. Can you fix it?'
    );
  });
  $rootScope.$on('intercom::confirmedSetup', function () {
    console.log('intercom::confirmedSetup');
    $window.Intercom(
      'showNewMessage',
      'Hey! I need help setting up my application.'
    );
  });
  $rootScope.$on('intercom::migrating', function () {
    console.log('intercom::migrating');
    $window.Intercom(
      'showNewMessage',
      'Help! I\'m having issues with migration.'
    );
  });
  $rootScope.$on('intercom::pawsd', function () {
    console.log('intercom::pawsd');
    $window.Intercom(
      'showNewMessage',
      'Can you help me back into Runnable?'
    );
  });
  return {};
}
