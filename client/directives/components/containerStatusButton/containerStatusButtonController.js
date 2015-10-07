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
  var CSBC = this;

  function modInstance(action, opts) {
    $rootScope.$broadcast('close-popovers');
    return promisify(CSBC.instance, action)(
      opts
    )
      .catch(errs.handler);
  }

  CSBC.actions = {
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
      promisify(CSBC.instance.build, 'deepCopy')()
        .then(function (build) {
          return updateInstanceWithNewBuild(
            CSBC.instance,
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
      CSBC.shouldShowUpdateConfigsPrompt = false;
      loading('main', true);
      var instanceUpdates = {};
      promisify(CSBC.instance, 'fetchMasterPod', true)()
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
          var currentAcvAttrs = CSBC.instance.contextVersion.getMainAppCodeVersion().attrs;
          // Delete the transformRules, since we don't want to update what Master had
          delete currentAcvAttrs.transformRules;
          return promisify(
            instanceUpdates.contextVersion.getMainAppCodeVersion(),
            'update'
          )(CSBC.instance.contextVersion.getMainAppCodeVersion().attrs);
        })
        .then(function () {
          return updateInstanceWithNewBuild(
            CSBC.instance,
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
  };
  CSBC.shouldShowUpdateConfigsPrompt = false;


}
