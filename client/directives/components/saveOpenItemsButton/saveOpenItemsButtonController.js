'use strict';

require('app')
  .controller('SaveOpenItemsButtonController', SaveOpenItemsButtonController);
/**
 * @ngInject
 */
function SaveOpenItemsButtonController(
  $q,
  $scope,
  $timeout,
  errs,
  loadingPromises,
  promisify,
  ModalService
) {
  var SOIBC = this;

  SOIBC.saveChanges = function (andRestart) {
    SOIBC.saving = true;
    var updateModelPromises = $scope.openItems.getAllFileModels(true)
      .map(function (model) {
        return model.actions.saveChanges();
      });
    $q.all(
      updateModelPromises,
      $timeout(angular.noop, 1500)
    )
      .then(function () {
        if (andRestart) {
          return promisify($scope.instance, 'restart')();
        }
      })
      .catch(errs.handler)
      .finally(function () {
        $scope.saving = false;
      });
  };
}
