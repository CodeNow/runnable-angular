'use strict';

require('app').controller('IsolationConfigurationModalController', IsolationConfigurationModalController);

function IsolationConfigurationModalController(
  instance,
  close,
  fetchInstancesByPod
) {
  var ICMC = this;
  ICMC.instance = instance;
  ICMC.close = close;

  ICMC.createIsolation = function () {
    console.log('Create isolation!');
    close();
  };


  fetchInstancesByPod()
    .then(function (instances) {
      instances = instances.filter(function (instance) {
        return instance !== ICMC.instance;
      });

      ICMC.repoInstances = instances.filter(function (instance) {
        return instance.getRepoName();
      });
      ICMC.nonRepoInstances = instances.filter(function (instance) {
        return !instance.getRepoName();
      });
    });
}


