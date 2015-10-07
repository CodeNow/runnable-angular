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
  promisify
) {
  var SOIBC = this;

  SOIBC.saveChanges = function (andRestart) {
    SOIBC.loading = true;
    var updateModelPromises = $scope.SOIBC.openItems.getAllFileModels(true)
      .map(function (model) {
        return model.actions.saveChanges();
      });
    $q.all(
      updateModelPromises,
      $timeout(angular.noop, 1500)
    )
      .then(function () {
        if (andRestart) {
          return promisify($scope.SOIBC.instance, 'restart')();
        }
      })
      .catch(errs.handler)
      .finally(function () {
        SOIBC.loading = false;
      });
  };
}
