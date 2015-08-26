'use strict';

require('app')
  .controller('ControllerDebug', ControllerDebug);


function ControllerDebug(
  $rootScope,
  debugContainer,
  instance,
  errs,
  $scope,
  OpenItems
) {
  this.openItems = new OpenItems();

  var dataApp = $rootScope.dataApp = {
    inDebug: true,
    data: {
      modalError: {
        data: {},
        actions: {
          close: function () {
            errs.clearErrors();
            dataApp.data.modalError.data.in = false;
          }
        }
      }
    }
  };

  $scope.$watch(function () {
    return errs.errors.length;
  }, function(n) {
    if (n) {
      dataApp.data.modalError.data.errors = errs.errors;
      dataApp.data.modalError.data.in = true;
    }
  });


  var CD = this;
  this.instance = instance;
  this.debugContainer = debugContainer;
  console.log(debugContainer);
  console.log(instance);

  console.log(debugContainer.rootDir);



  //if (!data.openItems.hasOpen('BuildStream')) {
  //  data.openItems.addBuildStream();
  //}
}
