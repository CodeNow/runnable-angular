'use strict';

require('app')
  .controller('ControllerDebug', ControllerDebug);


function ControllerDebug(
  $rootScope,
  debugContainer,
  instance,
  errs,
  promisify,
  $scope
) {

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

  this.fsList = null;

  promisify(debugContainer, 'fetchFsList')()
    .then(function (fsList) {
      CD.fsList = fsList;
    })
    .catch(errs.handler);
}
