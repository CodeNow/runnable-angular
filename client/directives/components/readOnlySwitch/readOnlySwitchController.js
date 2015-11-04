'use strict';

require('app')
  .controller('ReadOnlySwitchController', ReadOnlySwitchController);
/**
 * @ngInject
 */
function ReadOnlySwitchController(
  $scope,
  createBuildFromContextVersionId,
  errs,
  loading,
  loadingPromises,
  promisify,
  ModalService,
  keypather,
  fetchUser,
  updateDockerfileFromState,
  $rootScope,
  $q
) {
  var ROSC = this;
  function performRollback () {
    return ROSC.state.promises.contextVersion
      .then(function (contextVersion) {
        return loadingPromises.add(
          ROSC.loadingPromisesTarget,
          promisify(contextVersion, 'rollback')({lastBuiltSimpleContextVersion: ROSC.state.instance.attrs.lastBuiltSimpleContextVersion})
            .then(function (rolledBackContextVersion) {
              return $scope.$emit('resetStateContextVersion', rolledBackContextVersion, true);
            })
            .catch(function (err) {
              errs.handler(err);
              return $scope.$emit('resetStateContextVersion', contextVersion, true);
            })
        );
    });
  }

  // Getter/setter
  this.readOnly = function (newAdvancedMode) {
    if (newAdvancedMode === true) {
      // Store a promise for when we have properly switched to advanced mode
      ROSC.switchModePromise = loadingPromises.finished(ROSC.loadingPromisesTarget)
        .then(function () {
          // If there is not instance, we need to copy this context version and
          // keep a reference to the original CV
          if (!ROSC.state.instance) {
            ROSC.state.isBuilding = true;
            return updateDockerfileFromState(ROSC.state, true, true)
              .then(function () {
                // Save changes to the context version
                ROSC.state.simpleContextVersionCopy = ROSC.state.contextVersion;
                $scope.$emit('resetStateContextVersion', ROSC.state.contextVersion, true);
              });
          }
        })
        .then(function () {
          if (ROSC.state.instance && !ROSC.state.instance.attrs.lastBuiltSimpleContextVersion) {
            // Grab off of the instance, since it's the original one, and hasn't been modified
            ROSC.state.instance.attrs.lastBuiltSimpleContextVersion = {
              id: ROSC.state.instance.contextVersion.attrs.id,
              created: ROSC.state.instance.contextVersion.attrs.created
            };
          }
          if (ROSC.state.promises) {
            return ROSC.state.promises.contextVersion
              .then(function (contextVersion) {
                if (!ROSC.state.instance && (ROSC.state.simpleContextVersionCopy.id() === contextVersion.id)) {
                  return $q.reject(new Error(
                    'simpleContextVersionCopy was not properly copied.' +
                    'ContextVersion ID and simpleContextVersionCopy ID are the same.'
                  ));
                }
                ROSC.state.advanced = newAdvancedMode;
                return loadingPromises.add(ROSC.loadingPromisesTarget,
                  promisify(contextVersion, 'update')({
                    advanced: newAdvancedMode
                  })
                  .then(function () {
                    return promisify(contextVersion, 'fetch')();
                  }));
              })
              .catch(function (err) {
                errs.handler(err);
                ROSC.state.advanced = !newAdvancedMode;
              });
          }
          ROSC.state.advanced = newAdvancedMode;
          return true;
        })
        .finally(function () {
          if (!ROSC.state.instance) {
            ROSC.state.isBuilding = false;
          }
        });
      return ROSC.switchModePromise;
    }
    if (newAdvancedMode === false) {
      // If switching from advanced to basic
      return $q.when(true)
        .then(function () {
          if (!ROSC.state.instance) {
            return {
              controller: 'ConfirmationModalController',
              templateUrl: 'confirmSwitchToSimpleModeView'
            };
          }
          return {
            controller: 'ConfirmRollbackModalController',
            templateUrl: 'confirmRollbackModalView',
            inputs: {
              instance: ROSC.state.instance
            }
          };
        })
        .then(function (opts) {
          return ROSC.state.promises.contextVersion
            .then(function (contextVersion) {
              return ModalService.showModal({
                controller: opts.controller,
                controllerAs: 'CMC',
                templateUrl: opts.templateUrl,
                inputs: opts.inputs
              })
              .then(function (modal) {
                return modal.close;
              })
              .then(function (confirmed) {
                if (confirmed) {
                  if (!ROSC.state.instance) {
                    return $q.when(ROSC.switchModePromise)
                      .then(function () {
                        $scope.$emit('resetStateContextVersion', ROSC.state.simpleContextVersionCopy, true);
                        return false;
                      });
                  }
                  return performRollback(contextVersion);
                } else {
                  ROSC.state.advanced = true;
                  return ROSC.state.advanced;
                }
              });
            });
        })
        .catch(errs.handler);
    }
    return ROSC.state.advanced;
  };
}

