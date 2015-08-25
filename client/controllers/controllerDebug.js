'use strict';

require('app')
  .controller('ControllerDebug', ControllerDebug);


function ControllerDebug(
  $rootScope
) {
  $rootScope.dataApp = {
    inDebug: true
  };
}
