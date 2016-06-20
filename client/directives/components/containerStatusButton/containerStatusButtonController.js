'use strict';

require('app')
  .controller('ContainerStatusButtonController', ContainerStatusButtonController);
/**
 * @ngInject
 */
function ContainerStatusButtonController(
  $rootScope,
  errs,
  keypather,
  loading,
  promisify,
  updateInstanceWithNewBuild
) {
  var CSBC = this;
  CSBC.doesMatchMasterPod = function () {
    return !CSBC.instance.doesMatchMasterPod().isFulfilled() || CSBC.instance.doesMatchMasterPod().value();
  };

  function modInstance(action, opts) {
    $rootScope.$broadcast('close-popovers');
    return promisify(CSBC.instance, action)(
      opts
    )
      .catch(errs.handler);
  }

  CSBC.isTesting = function () {
    return keypather.get(CSBC, 'instance.isolation.groupMaster.attrs.isTesting') ||
      keypather.get(CSBC, 'instance.attrs.isTesting');
  };

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
      $rootScope.$broadcast('close-popovers');
      loading('main', true);
      var instance = CSBC.instance;
      if (keypather.get(CSBC, 'instance.isolation.groupMaster.attrs.isTesting')) {
        instance = keypather.get(CSBC, 'instance.isolation.groupMaster');
      }
      promisify(instance.build, 'deepCopy')()
        .then(function (build) {
          return updateInstanceWithNewBuild(
            instance,
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
      // This function makes a copy the master's cv and build, then applies them to this instance
      // This basically updates everything to match with Master
      $rootScope.$broadcast('close-popovers');
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
          var currentAcv = CSBC.instance.contextVersion.getMainAppCodeVersion();
          var parentAcv = CSBC.instance.contextVersion.getMainAppCodeVersion();
          if (!currentAcv || !parentAcv) {
            return;
          }
          // Delete the transformRules, since we don't want to update what Master had (erasing the update)
          delete currentAcv.attrs.transformRules;
          return promisify(
            instanceUpdates.contextVersion.getMainAppCodeVersion(),
            'update'
          )(currentAcv.attrs);
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


}
