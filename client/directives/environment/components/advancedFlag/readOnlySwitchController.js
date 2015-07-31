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
    performRollback: function (originalContextVersion, lastBuiltSimpleContextVersionObject) {
      return loadingPromises.add(
        $scope.loadingPromisesTarget,
        promisify(originalContextVersion, 'rollback')({lastBuiltSimpleContextVersion: lastBuiltSimpleContextVersionObject})
          .then(function (rolledBackContextVersion) {
            return $scope.resetStateContextVersion(rolledBackContextVersion, true);
          })
          .catch(function (err) {
            errs.handler(err);
            return $scope.resetStateContextVersion(originalContextVersion, true);
          })
      );
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
      }
      // If switching from advanced to basic
      return $scope.state.promises.contextVersion
        .then(function (contextVersion) {
          ROSC.popover.active = true;
          ROSC.popover.contextVersion = contextVersion;
          ROSC.popover.instance = $scope.state.instance;
        });
    } else {
      return $scope.state.advanced;
    }
  };
}
