'use strict';

require('app')
  .controller('ControllerDebug', ControllerDebug);


function ControllerDebug(
  $rootScope,
  debugContainer,
  instance
) {
  $rootScope.dataApp = {
    inDebug: true
  };
  this.instance = instance;
  this.debugContainer = debugContainer;
  console.log(debugContainer);
  console.log(instance);
}
