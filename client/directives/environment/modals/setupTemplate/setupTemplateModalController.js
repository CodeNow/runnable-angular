'use strict';

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
  close
) {
  var STMC = this;
  fetchInstances({ githubUsername: 'HelloRunnable' })
    .then(function (servers) {
      STMC.templateServers = servers;
    })
    .catch(errs.handler);
  this.close = close;
  this.addServerFromTemplate = function (sourceInstance) {
    return fetchInstances()
      .then(function (instances) {
        var serverName = getNewForkName(sourceInstance, instances, true);
        var serverModel = {
          opts: {
            name: serverName,
            masterPod: true
          }
        };
        close();
        return createAndBuildNewContainer(
          copySourceInstance(
            $rootScope.dataApp.data.activeAccount,
            sourceInstance,
            serverName
          )
            .then(function (build) {
              serverModel.build = build;
              return serverModel;
            }),
          serverName
        );
      });
  };
}