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
  promisify,
  ModalService,
  keypather,
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
    if (newAdvancedMode !== undefined) {
      if (newAdvancedMode === true) {
        ROSC.state.advanced = newAdvancedMode;
        return $q.when(true)
          .then(function () {
            // If there is not instance, we need to copy this context version and
            // keep a reference to the original CV
            if (!ROSC.state.instance) {
              // Save copy of simple mode CV to state
              ROSC.state.allContextVersions = {
                'simple': ROSC.state.contextVersion
              };
              return promisify(ROSC.state.contextVersion, 'deepCopy')()
                .then(function (contextVersion) {
                  ROSC.state.contextVersion = contextVersion;
                  // Set advanced CV
                  ROSC.state.allContextVersions.advanced = ROSC.state.contextVersion;
                  ROSC.state.acv = contextVersion.getMainAppCodeVersion();
                  ROSC.state.repo = keypather.get(contextVersion, 'getMainAppCodeVersion().githubRepo');
                  return promisify(contextVersion, 'fetch')();
                });
            }
            return ROSC.state.contextVersion;
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
                  return loadingPromises.add(ROSC.loadingPromisesTarget,
                    promisify(contextVersion, 'update')({
                      advanced: newAdvancedMode
                    })
                    .then(function () {
                      return promisify(contextVersion, 'fetch')()
                      .then(function (_contextVersion) {
                        return _contextVersion;
                      });
                    }));
                })
                .catch(function (err) {
                  errs.handler(err);
                  ROSC.state.advanced = !newAdvancedMode;
                });
            }
            return true;
          });
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
                  ROSC.state.advanced = true;
                }
              });
            });
        })
        .catch(errs.handler);
    }
  };
}

