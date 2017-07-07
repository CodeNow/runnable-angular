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
  errs,
  fetchInstances,
  fetchTemplateServers,
  getNewForkName,
  promisify,
  ModalService,
  close,
  isolation
) {
  var STMC = this;
  fetchTemplateServers()
    .then(function (servers) {
      STMC.templateServers = servers;
    })
    .catch(errs.handler);
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
        return ModalService.showModal({
          controller: 'NameNonRepoContainerViewModalController',
          controllerAs: 'MC',
          templateUrl: 'nameNonRepoContainerView',
          inputs: {
            name: serverName,
            instanceToForkName: instanceToForkName,
            sourceInstance: sourceInstance,
            isolation: isolation
          }
        });
      })
      .catch(errs.handler);
  };
}
