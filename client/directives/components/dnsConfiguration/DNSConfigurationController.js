'use strict';

require('app')
  .controller('DNSConfigurationController', DNSConfigurationController);

function DNSConfigurationController(
  loading,
  errs,
  promisify,
  getInstanceMaster,
  keypather
) {
  loading('dns', true);
  var DCC = this;

  DCC.instanceDependencyMap = {};
  // Fetch dependencies
  promisify(DCC.instance, 'fetchDependencies')()
    .then(function (_dependencies) {
      _dependencies.models = _dependencies.models.filter(function (dep) {
        return keypather.get(dep.instance, 'contextVersion.getMainAppCodeVersion()');
      });
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

    var worstStatus = '';
    for(var i=0; i < DCC.dependencies.models.length; i++) {
      var status = DCC.dependencies.models[i].instance.status();
      if (['buildFailed', 'crashed'].includes(status)) {
        worstStatus = 'red';
        break; // Short circuit!
      } else if (['starting', 'neverStarted', 'building'].includes(status)) {
        worstStatus = 'orange';
      }
    }
    return worstStatus;
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
