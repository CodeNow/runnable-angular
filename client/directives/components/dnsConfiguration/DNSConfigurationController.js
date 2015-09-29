'use strict';

require('app')
  .controller('DNSConfigurationController', DNSConfigurationController);

function DNSConfigurationController(
  loading,
  errs,
  promisify,
  getInstanceMaster,
  $timeout
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

  DCC.editDependency = function (dep) {
    loading('dnsDepData', true);

    DCC.lastModifiedDNS = null;
    DCC.modifyingDNS = {
      current: dep,
      options: []
    };
    getInstanceMaster(dep)
      .then(function (masterInstance) {
        DCC.modifyingDNS.options.push(masterInstance);
        DCC.modifyingDNS.options = DCC.modifyingDNS.options.concat(masterInstance.children.models);
        loading('dnsDepData', false);
      });
  };

  DCC.selectInstance = function (instance) {
    var dependency = DCC.modifyingDNS.current;
    DCC.modifyingDNS = {};
    DCC.lastModifiedDNS = dependency;

    promisify(dependency, 'update')({
      hostname:  instance.getElasticHostname(),
      instance: instance.attrs.shortHash
    })
      .catch(errs.handler);
  };
}
