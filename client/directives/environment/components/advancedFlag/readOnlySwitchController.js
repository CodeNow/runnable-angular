'use strict';

require('app')
  .controller('ReadOnlySwitchController', ReadOnlySwitchController);
/**
 * @ngInject
 */
function ReadOnlySwitchController(
  $scope,
  errs,
  loadingPromises,
  promisify
) {
  var ROSC = this;
  this.popover = {
    performRollback: function (rolledContextVersion) {
      $scope.resetStateContextVersion(rolledContextVersion, true);
    }
  };
  // Getter/setter
  this.readOnly = function (newAdvancedMode) {
    // when setting to readOnly
    if (arguments.length) {
      if (newAdvancedMode) {
        $scope.state.advanced = newAdvancedMode;
        return $scope.state.promises.contextVersion
          .then(function (contextVersion) {
            return loadingPromises.add($scope.loadingPromisesTarget,
              promisify(contextVersion, 'update')({
                advanced: newAdvancedMode
              })
              .then(function () {
                promisify(contextVersion, 'fetch')();
              }));
          })
          .catch(function (err) {
            errs.handler(err);
            $scope.state.advanced = !newAdvancedMode;
          });
      } else {
        // If switching from advanced to basic
        return $scope.state.promises.contextVersion
          .then(function (contextVersion) {
            return promisify(contextVersion, 'rollback')();
          })
          .then(function (contextVersion) {
            ROSC.popover.rolledContextVersion = contextVersion;
            ROSC.popover.active = true;
          });
      }
    } else {
      return $scope.state.advanced;
    }
  };
}
