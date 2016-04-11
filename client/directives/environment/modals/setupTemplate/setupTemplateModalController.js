'use strict';

// TODO: Some of this code could be removed after removing the
// `dockerFileMirroring` flag, but not a lot because isolation uses this modal
require('app')
  .controller('SetupTemplateModalController', SetupTemplateModalController);
/**
 * SetupTemplateModalController
 * @constructor
 * @export
 * @ngInject
 */
function SetupTemplateModalController(
  $rootScope,
  copySourceInstance,
  createAndBuildNewContainer,
  errs,
  fetchInstances,
  getNewForkName,
  promisify,
  eventTracking,
  helpCards,
  close,
  isolation
) {
  var STMC = this;
  fetchInstances({ githubUsername: 'HelloRunnable' })
    .then(function (servers) {
      STMC.templateServers = servers;
    })
    .catch(errs.handler);
  STMC.helpCard = helpCards.getActiveCard();
  STMC.close = close;
  STMC.addServerFromTemplate = function (sourceInstance) {
    var instancesPromise = null;
    var instanceToForkName = sourceInstance.attrs.name;
    if (isolation && isolation.instances) {
      instancesPromise = promisify(isolation.instances, 'fetch')();
      instanceToForkName = isolation.groupMaster.attrs.shortHash + '--' + instanceToForkName;
    } else {
      instancesPromise = fetchInstances();
    }

    close();
    return instancesPromise
      .then(function (instances) {
        var serverName = getNewForkName(instanceToForkName, instances, true);
        var serverModel = {
          opts: {
            name: serverName,
            masterPod: true,
            ipWhitelist: {
              enabled: true
            }
          }
        };
        return createAndBuildNewContainer(
          copySourceInstance(
            $rootScope.dataApp.data.activeAccount,
            sourceInstance,
            serverName
          )
            .then(function (build) {
              serverModel.build = build;
              eventTracking.createdNonRepoContainer(instanceToForkName);
              return serverModel;
            }),
          serverName,
          { isolation: isolation }
        );
      })
      .catch(errs.handler);
  };
}
