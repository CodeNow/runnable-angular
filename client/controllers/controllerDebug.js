'use strict';

require('app')
  .controller('ControllerDebug', ControllerDebug);


function ControllerDebug(
  $rootScope,
  debugContainer,
  instance,
  errs,
  promisify
) {
  var CD = this;
  $rootScope.dataApp = {
    inDebug: true
  };
  this.instance = instance;
  this.debugContainer = debugContainer;
  console.log(debugContainer);
  console.log(instance);

  this.fsList = null;

  promisify(debugContainer, 'fetchFsList')()
    .then(function (fsList) {
      CD.fsList = fsList;
    })
    .catch(errs.handler);
}
