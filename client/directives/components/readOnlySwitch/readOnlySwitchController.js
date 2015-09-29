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
        ModalService.showModal({
          controller: 'ConfirmationModalController',
          controllerAs: 'CMC',
          templateUrl: 'confirmSetupAdvancedModalView'
        })
          .then(function (modal) {
            return modal.close;
          })
          .then(function (confirmed) {
            if (confirmed) {
              if (newAdvancedMode === true) {
                // when setting to readOnly
                ROSC.state.advanced = newAdvancedMode;
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
                          promisify(contextVersion, 'fetch')();
                        }));
                    })
                    .catch(function (err) {
                      errs.handler(err);
                      ROSC.state.advanced = !newAdvancedMode;
                    });
                }
                return $q.when(true);
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
                    })
                    .catch(errs.handler);
                });
            }
          })
          .catch(errs.handler);
    } else {
      return ROSC.state.advanced;
    }
  };
}
