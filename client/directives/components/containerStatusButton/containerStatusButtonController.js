'use strict';

require('app')
  .controller('ContainerStatusButtonController', ContainerStatusButtonController);
/**
 * @ngInject
 */
function ContainerStatusButtonController(
  $q,
  $rootScope,
  $timeout,
  errs,
  loading,
  loadingPromises,
  updateInstanceWithNewBuild,
  promisify,
  ModalService
) {
  var SOIBC = this;

  function modInstance(action, opts) {
    $rootScope.$broadcast('close-popovers');
    return promisify(SOIBC.instance, action)(
      opts
    )
      .catch(errs.handler);
  }

  SOIBC.popoverStatusOptions = {
    actions: {
      stopInstance: function () {
        modInstance('stop');
      },
      startInstance: function () {
        modInstance('start');
      },
      restartInstance: function () {
        modInstance('restart');
      },
      rebuildWithoutCache: function () {
        loading('main', true);
        promisify(SOIBC.instance.build, 'deepCopy')()
          .then(function (build) {
            return updateInstanceWithNewBuild(
              SOIBC.instance,
              build,
              true
            );
          })
          .catch(errs.handler)
          .finally(function () {
            loading('main', false);
          });


      },
      updateConfigToMatchMaster: function () {
        SOIBC.popoverStatusOptions.data.shouldShowUpdateConfigsPrompt = false;
        loading('main', true);
        var instanceUpdates = {};
        promisify(SOIBC.instance, 'fetchMasterPod', true)()
          .then(function (masterPodInstances) {
            var masterPodInstance = masterPodInstances.models[0];
            instanceUpdates.masterPodInstance = masterPodInstance;
            instanceUpdates.opts = {
              env: masterPodInstance.attrs.env
            };
            return promisify(instanceUpdates.masterPodInstance.build, 'deepCopy')();
          })
          .then(function (build) {
            instanceUpdates.build = build;
            instanceUpdates.contextVersion = build.contextVersions.models[0];
            return promisify(instanceUpdates.contextVersion, 'fetch')();
          })
          .then(function () {
            var currentAcvAttrs = SOIBC.instance.contextVersion.getMainAppCodeVersion().attrs;
            // Delete the transformRules, since we don't want to update what Master had
            delete currentAcvAttrs.transformRules;
            return promisify(
              instanceUpdates.contextVersion.getMainAppCodeVersion(),
              'update'
            )(SOIBC.instance.contextVersion.getMainAppCodeVersion().attrs);
          })
          .then(function () {
            return updateInstanceWithNewBuild(
              SOIBC.instance,
              instanceUpdates.build,
              true,
              instanceUpdates.opts
            );
          })
          .catch(errs.handler)
          .finally(function () {
            loading('main', false);
          });
      }
    },
    data: {
      shouldShowUpdateConfigsPrompt: false,
      instance: SOIBC.instance
    }
  };
}
