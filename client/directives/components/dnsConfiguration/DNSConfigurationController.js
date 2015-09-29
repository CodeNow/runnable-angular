'use strict';

require('app')
  .controller('DNSConfigurationController', DNSConfigurationController);

function DNSConfigurationController(
  loading,
  errs,
  promisify,
  getInstanceMaster
) {
  loading('dns', true);
  var DCC = this;

  DCC.instanceDependencyMap = {};
  // Fetch dependencies
  promisify(DCC.instance, 'fetchDependencies')()
    .then(function (_dependencies) {
      DCC.dependencies = _dependencies;
      return _dependencies;
    })
    .catch(errs.handler)
    .finally(function () {
      loading('dns', false);
    });

  DCC.getWorstStatusClass = function () {
    if (!DCC.dependencies) {
      return;
    }
    for(var i=0; i < DCC.dependencies.models.length; i++) {
      var status = DCC.dependencies.models[i].instance.status();
      if (['buildFailed', 'crashed'].includes(status)) {
        return 'red';
      } else if (['starting', 'neverStarted', 'building'].includes(status)) {
        return 'orange';
      }
    }
  };

  DCC.editDependency = function (dep) {
    loading('dnsDepData', true);

    DCC.lastModifiedDNS = null;
    DCC.modifyingDNS = {
      current: dep,
      options: []
    };
    getInstanceMaster(dep.instance)
      .then(function (masterInstance) {
        DCC.modifyingDNS.options.push(masterInstance);
        DCC.modifyingDNS.options = DCC.modifyingDNS.options.concat(masterInstance.children.models);
        loading('dnsDepData', false);
      });
  };

  DCC.selectInstance = function (instance) {
    var dependency = DCC.modifyingDNS.current;
    dependency.instance = instance;
    DCC.modifyingDNS = {};
    DCC.lastModifiedDNS = dependency;

    promisify(dependency, 'update')({
      hostname:  instance.getElasticHostname(),
      instance: instance.attrs.shortHash
    })
      .catch(errs.handler);
  };
}
