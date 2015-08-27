'use strict';

require('app')
  .controller('ControllerDebug', ControllerDebug);


function ControllerDebug(
  $rootScope,
  debugContainer,
  instance,
  errs,
  $scope,
  OpenItems,
  featureFlags
) {
  this.openItems = new OpenItems();
  this.openItems.addTerminal();
  this.openItems.addBuildStream();

  $rootScope.featureFlags = featureFlags.flags;
  $rootScope.resetFeatureFlags = featureFlags.reset;

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

  this.instance = instance;
  this.debugContainer = debugContainer;
}
