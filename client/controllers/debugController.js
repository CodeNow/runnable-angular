'use strict';

require('app')
  .controller('DebugController', DebugController);


function DebugController(
  $rootScope,
  fileExplorerState,
  debugContainer,
  instance,
  errs,
  $scope,
  OpenItems,
  featureFlags,
  $q,
  keypather
) {
  var DC = this;
  DC.fileExplorerState = fileExplorerState;
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

  this.saving = false;
  this.canSave = function () {
    return !!DC.openItems.models.find(function (model) {
      return model.state.isDirty;
    });
  };
  this.saveChanges = function () {
    DC.saving = true;

    var updateModelPromises = DC.openItems.models.filter(function (model) {
      return (typeof keypather.get(model, 'actions.saveChanges') === 'function');
    }).map(function (model) {
      return model.actions.saveChanges();
    });

    $q.all(updateModelPromises)
      .catch(errs.handler)
      .finally(function () {
        DC.saving = false;
      });
  };
}