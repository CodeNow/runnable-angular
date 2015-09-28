'use strict';

require('app')
  .controller('DNSConfigurationController', DNSConfigurationController);

function DNSConfigurationController(
  loading,
  errs,
  promisify
) {
  loading('dns', true);
  var DCC = this;

  DCC.instanceDependencyMap = {};
  var dependenciesPromise = promisify(DCC.instance, 'fetchDependencies')()
    .then(function (_dependencies) {
      DCC.dependencies = _dependencies;
      console.log(_dependencies);
      return _dependencies;
    })
    .catch(errs.handler)
    .finally(function () {
      loading('dns', false);
    });

  DCC.getWorstStatusClass = function () {
    var statusMap = {
      'stopped': 'gray',
      'crashed': 'red',
      'running': 'green',
      'buildFailed': 'red',
      'building': 'orange',
      'neverStarted': 'orange',
      'unknown': 'gray',
      'starting': 'orange',
      'stopping': 'green'
    };

    if (!DCC.dependencies) {
      return 'unknown';
    }
    var stati = {};
    DCC.dependencies.forEach(function (dependency) {
      var instance = dependency.instance;
      stati[statusMap[instance.status()]] = true;
    });

    var order = ['red', 'orange', 'gray', 'green'];
    for (var i=0; i<order.length; i++) {
      var key = order[i];
      if(stati[key]) {
        return key;
      }
    }
    return '';
  };


  DCC.actions = {
    setDependency: function (instance) {
      var masterInstance = DCC.relatedMasterInstances.find(function (master) {
        return master.attrs.contextVersion.context === instance.attrs.contextVersion.context;
      });

      return dependenciesPromise.then(function (dependencies) {
        var dependency = dependencies.models.find(function (dependency) {
          return dependency.attrs.contextVersion.context === masterInstance.attrs.contextVersion.context;
        });

        return promisify(dependency, 'update')({
          hostname: masterInstance.getElasticHostname(),
          instance: instance.attrs.shortHash
        })
          .catch(errs.handler);
      });
    }
  };
}
