'use strict';

require('app')
  .directive('dnsManager', dnsManager);
/**
 * dnsManager Directive
 * @ngInject
 */
function dnsManager(
  createInstanceUrl,
  errs,
  getInstanceClasses,
  $localStorage,
  promisify,
  getInstanceMaster,
  $q
) {
  return {
    restrict: 'A',
    scope: {
      instance: '='
    },
    templateUrl: 'viewDnsManager',
    link: function ($scope, element, attrs) {
      $scope.$storage = $localStorage.$default({
        dnsManagementIsClosed: true
      });
      $scope.getInstanceClasses = getInstanceClasses;
      // We need the entire dependency tree.
      $scope.subDependencies = [];

      // I need to know the related master pods (Master)
      $scope.directlyRelatedMasterInstances = [];

      // I need to know which instances I am not directly related to. (At the moment none because we don't detect that yet)
      $scope.indirectlyRelatedInstances = [];

      // I need to know the dependencies for this instance keyed on context ([A:master, B:fb-1])
      $scope.instanceDependencyMap = {};

      $scope.isDnsSetup = false;

      $scope.readOnly = $scope.instance.masterPod;

      promisify($scope.instance, 'fetchDependencies')()
        .then(function (_dependencies) {
          $scope.dependencies = _dependencies;
          var promiseFetchMasters = _dependencies.models.map(function (dependency) {
            $scope.instanceDependencyMap[dependency.attrs.contextVersion.context] = dependency;
            return getInstanceMaster(dependency)
              .then(function (masterInstance) {
                return promisify(masterInstance.children, 'fetch')()
                  .then(function () {
                    return masterInstance;
                  });
              });
          });
          return $q.all(promiseFetchMasters);
        })
          .then(function (masters) {
            $scope.directlyRelatedMasterInstances = masters;
            $scope.masterInstancesWithChildren = $scope.directlyRelatedMasterInstances.filter(function (instance) {
              return instance.children.models.length !== 0;
            });
            $scope.masterInstancesWithoutChildren = $scope.directlyRelatedMasterInstances.filter(function (instance) {
              return instance.children.models.length === 0;
            });
          })
          .catch(errs.handler)
          .finally(function () {
            $scope.isDnsSetup = true;
          });

      $scope.getRelatedInstancesList = function () {
        return Object.keys($scope.instanceDependencyMap).map(function (key) {
          var searchShortHash = $scope.instanceDependencyMap[key].attrs.shortHash;
          var depMaster = $scope.directlyRelatedMasterInstances.find(function (masterInstance) {
            return masterInstance.attrs.contextVersion.context === key;
          });
          if (depMaster.attrs.shortHash === searchShortHash){
            return depMaster;
          }
          return depMaster.children.models.find(function (child) {
            return child.attrs.shortHash === searchShortHash;
          });
        });
      };

      $scope.actions = {
        setDependency: function (instance) {
          var masterInstance = $scope.directlyRelatedMasterInstances.find(function (master) {
            return master.attrs.contextVersion.context === instance.attrs.contextVersion.context;
          });

          var dependency = $scope.dependencies.models.find(function (dependency) {
            return dependency.attrs.contextVersion.context === masterInstance.attrs.contextVersion.context;
          });

          return promisify(dependency, 'update')({
            hostname: createInstanceUrl(masterInstance),
            instance: instance.attrs.shortHash
          })
          .catch(errs.handler);
        }
      };
    }
  };
}
