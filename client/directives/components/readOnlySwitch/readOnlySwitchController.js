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
      ROSC.state.advanced = newAdvancedMode;
      loading(ROSC.loadingPromisesTarget, true);
      // Store a promise for when we have properly switched to advanced mode
      ROSC.switchModePromise = $q.when(true)
        .then(function () {
          // If there is not instance, we need to copy this context version and
          // keep a reference to the original CV
          if (!ROSC.state.instance) {
            // Save changes to the context version
            return updateDockerfileFromState(ROSC.state, true, true)
              .then(function () {
                return promisify(ROSC.state.contextVersion, 'deepCopy')();
              })
              .then(function (contextVersionCopy) {
                // Save a copy of our last simple mode CV to state
                ROSC.state.simpleContextVersionCopy = contextVersionCopy;
                return ROSC.state.contextVersion;
              });
          }
          return ROSC.state.contextVersion;
        })
        .then(function (contextVersion) {
          if (ROSC.state.instance && !ROSC.state.instance.attrs.lastBuiltSimpleContextVersion) {
            // Grab off of the instance, since it's the original one, and hasn't been modified
            ROSC.state.instance.attrs.lastBuiltSimpleContextVersion = {
              id: ROSC.state.instance.contextVersion.attrs.id,
              created: ROSC.state.instance.contextVersion.attrs.created
            };
          }
          if (ROSC.state.promises) {
            return ROSC.state.promises.contextVersion
              .then(function () {
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
          return true;
        })
        .then(function () {
          loading(ROSC.loadingPromisesTarget, false);
          return true;
        });
      return ROSC.switchModePromise;
    }
    if (newAdvancedMode === false) {
      if (!ROSC.state.instance) {
        return ModalService.showModal({
          controller: 'ConfirmationModalController',
          controllerAs: 'CMC',
          templateUrl: 'confirmSwitchToSimpleModeView'
        })
          .then(function (modal) {
            return modal.close.then(function (confirmed) {
              if (confirmed) {
                return $q.when(ROSC.switchModePromise)
                  .then(function () {
                    ROSC.state.advanced = false;
                    keypather.set(ROSC, 'state.simpleContextVersionCopy.attrs.advanced', false);
                    $scope.$emit('resetStateContextVersion', ROSC.state.simpleContextVersionCopy, true);
                    loading(ROSC.loadingPromisesTarget, false);
                    return false;
                  });
              }
              return true;
            });
          })
          .catch(errs.handler);
      }
      // If switching from advanced to basic
      return ROSC.state.promises.contextVersion
        .then(function (contextVersion) {
          ModalService.showModal({
            controller: 'ConfirmRollbackModalController',
            controllerAs: 'CMC',
            templateUrl: 'confirmRollbackModalView',
            inputs: {
              instance: ROSC.state.instance
            }
          })
            .then(function (modal) {
              modal.close.then(function (confirmed) {
                if (confirmed) {
                  performRollback(contextVersion);
                } else {
                  ROSC.state.advanced = false;
                  return false;
                }
              });
            });
        })
      .catch(errs.handler);
    }
    return ROSC.state.advanced;
  };
}

