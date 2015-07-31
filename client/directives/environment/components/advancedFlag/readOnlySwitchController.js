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
        ROSC.loadingPromisesTarget,
        promisify(originalContextVersion, 'rollback')({lastBuiltSimpleContextVersion: lastBuiltSimpleContextVersionObject})
          .then(function (rolledBackContextVersion) {
            return $scope.$emit('resetStateContextVersion', rolledBackContextVersion, true);
          })
          .catch(function (err) {
            errs.handler(err);
            return $scope.$emit('resetStateContextVersion', originalContextVersion, true);
          })
      );
    }
  };
  // Getter/setter
  this.readOnly = function (newAdvancedMode) {
    // when setting to readOnly
    if (arguments.length) {
      if (newAdvancedMode) {
        ROSC.state.advanced = newAdvancedMode;
        return ROSC.state.promises.contextVersion
          .then(function (contextVersion) {
            if (!ROSC.state.instance.attrs.lastBuiltSimpleContextVersion) {
              ROSC.state.instance.attrs.lastBuiltSimpleContextVersion = {
                id: contextVersion.attrs.id,
                created: contextVersion.attrs.created
              };
            }
            return loadingPromises.add(ROSC.loadingPromisesTarget,
              promisify(contextVersion, 'update')({
                advanced: newAdvancedMode
              })
              .then(function () {
                promisify(contextVersion, 'fetch')();
              }));
          })
          .catch(function (err) {
            errs.handler(err);
            ROSC.state.advanced = !newAdvancedMode;
          });
      }
      // If switching from advanced to basic
      return ROSC.state.promises.contextVersion
        .then(function (contextVersion) {
          ROSC.popover.active = true;
          ROSC.popover.contextVersion = contextVersion;
          ROSC.popover.instance = ROSC.state.instance;
        });
    } else {
      return ROSC.state.advanced;
    }
  };
}
