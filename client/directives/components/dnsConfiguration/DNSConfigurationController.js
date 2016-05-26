'use strict';

require('app')
  .controller('DNSConfigurationController', DNSConfigurationController);

function DNSConfigurationController(
  $q,
  $scope,
  $timeout,
  debounce,
  errs,
  getInstanceMaster,
  getMatchingIsolatedInstance,
  keypather,
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

    var fetches = {
      deps: promisify(DCC.instance, 'fetchDependencies')()
    };
    if (keypather.get(DCC.instance, 'isolation.instances')) {
      // For now, we need to fetch the isolated instances, so they have their CV model filled
      // (instance.cv, not instance.attrs.cv).  We need this because we need to know if these
      // instances are repo or not.  This will soon be fixed by saving this value on the instance
      fetches.isolated = promisify(DCC.instance.isolation.instances, 'fetch', true)();
    }
    $q.all(fetches)
      .then(function (results) {
        var dependencies = results.deps;
        $timeout.cancel(timeout);
        DCC.nonRepoDependencies = [];
        DCC.filteredDependencies = [];
        dependencies.models.forEach(function (dep) {
          if (dep.instance.destroyed) {
            return;
          }
          if (keypather.get(dep.instance, 'contextVersion.getMainAppCodeVersion()')) {
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
        DCC.modifyingDNS.options.push(masterInstance);
        DCC.modifyingDNS.options = DCC.modifyingDNS.options.concat(masterInstance.children.models);

        // Unshift so its always first
        DCC.modifyingDNS.options.unshift(getMatchingIsolatedInstance(DCC.instance.isolation, dep.instance));
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
