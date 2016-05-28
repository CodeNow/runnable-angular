'use strict';

require('app')
  .controller('DNSConfigurationController', DNSConfigurationController);

function DNSConfigurationController(
  $scope,
  $timeout,
  debounce,
  errs,
  getInstanceMaster,
  getMatchingIsolatedInstance,
  isRepoContainerService,
  loading,
  promisify
) {
  var DCC = this;
  DCC.instanceDependencyMap = {};
  DCC.nonRepoDependencies = [];
  DCC.filteredDependencies = [];

  var refreshDependencies = debounce(function () {
    // Delay showing loading state for 1 second. To allow DNS mappings to fetch.
    // If they don't fetch in 1 second we can show a loading state.
    var timeout = $timeout(function () {
      DCC.nonRepoDependencies = [];
      DCC.filteredDependencies = [];
      loading('dns', true);
    }, 1000);

    promisify(DCC.instance, 'fetchDependencies')()
      .then(function (dependencies) {
        $timeout.cancel(timeout);
        DCC.nonRepoDependencies = [];
        DCC.filteredDependencies = [];
        dependencies.models.forEach(function (dep) {
          if (dep.instance.destroyed) {
            return;
          }
          if (isRepoContainerService(dep.instance)) {
            DCC.filteredDependencies.push(dep);
          } else {
            DCC.nonRepoDependencies.push(dep);
          }
          dep.instance.on('destroy', handleDestroyedDepInstance);
        });
      })
      .catch(errs.handler)
      .finally(function () {
        loading.reset('dns');
      });
    $scope.$applyAsync();
  }, 500);

  DCC.getNumberOfConnections = function () {
    return DCC.nonRepoDependencies.length + DCC.filteredDependencies.length;
  };

  function handleDestroyedDepInstance() {
    DCC.filteredDependencies.forEach(function (dep) {
      dep.instance.off('destroy', handleDestroyedDepInstance);
    });
    DCC.nonRepoDependencies.forEach(function (dep) {
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
        if (masterInstance) {
          // masterInstance may be null if a master instance was deleted, but the isolated instance
          // has still remained
          DCC.modifyingDNS.options.push(masterInstance);
          DCC.modifyingDNS.options = DCC.modifyingDNS.options.concat(masterInstance.children.models);
        }
        var matchingIsolatedInstance = getMatchingIsolatedInstance(DCC.instance.isolation, dep.instance);
        // Unshift so its always first
        if (matchingIsolatedInstance) {
          DCC.modifyingDNS.options.unshift(matchingIsolatedInstance);
        }
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
