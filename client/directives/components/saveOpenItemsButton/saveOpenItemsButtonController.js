'use strict';

require('app')
  .controller('SaveOpenItemsButtonController', SaveOpenItemsButtonController);
/**
 * @ngInject
 */
function SaveOpenItemsButtonController(
  $q,
  errs,
  promisify
) {
  var SOIBC = this;

  SOIBC.saveChanges = function (andRestart) {
    var updateModelPromises = SOIBC.openItems.getAllFileModels(true)
      .map(function (model) {
        return model.actions.saveChanges();
      });
    return $q.all(updateModelPromises)
      .then(function () {
        if (andRestart) {
          return promisify(SOIBC.instance, 'restart')();
        }
      })
      .catch(errs.handler);
  };
}
