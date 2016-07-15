'use strict';

require('app')
  .controller('GracePeriodController', GracePeriodController);

function GracePeriodController(
  $rootScope
) {
  var WBC = this;

  $rootScope.dataApp = {
    gracePeriod: true
  };
  WBC.openIntercom = function () {
    window.Intercom(
      'showNewMessage',
      'I’m back! Help me get my containers back up and running.'
    );
  };
}
