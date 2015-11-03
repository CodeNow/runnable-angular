'use strict';

require('app')
  .controller('DNSConfigurationController', DNSConfigurationController);

function DNSConfigurationController(
  loading,
  errs,
  promisify,
  getInstanceMaster,
  keypather,
  $scope,
  debounce,
  $timeout
) {
  var DCC = this;
  DCC.instanceDependencyMap = {};

  var refreshDependencies = debounce(function () {
    // Delay showing loading state for 1 second. To allow DNS mappings to fetch.
    // If they don't fetch in 1 second we can show a loading state.
    var timeout = $timeout(function () {
      DCC.filteredDependencies = [];
      loading('dns', true);
    }, 1000);

    promisify(DCC.instance, 'fetchDependencies')()
      .then(function (dependencies) {
        $timeout.cancel(timeout);
        DCC.filteredDependencies = dependencies.models.filter(function (dep) {
          return !dep.instance.destroyed && keypather.get(dep.instance, 'contextVersion.getMainAppCodeVersion()');
        });

        DCC.filteredDependencies.forEach(function (dep) {
          dep.instance.on('destroy', handleDestroyedDepInstance);
        });
      })
      .catch(errs.handler)
      .finally(function () {
        loading.reset('dns');
      });
    $scope.$applyAsync();
  }, 500, true);

  function handleDestroyedDepInstance() {
    DCC.filteredDependencies.forEach(function (dep) {
      dep.instance.off('destroy', handleDestroyedDepInstance);
    });
    refreshDependencies();
  }

  // Fetch dependencies
  // Loading state immediately
  loading('dns', true);
  refreshDependencies();
  DCC.instance.on('update', refreshDependencies);
  $scope.$on('$destroy', function () {
    DCC.instance.off('update', refreshDependencies);
  });


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
