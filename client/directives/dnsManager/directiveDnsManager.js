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

      /*
       * We need to fetch our dependencies. They are stored in a complicated way:
       *
       * 1. Get our master instance
       * 2. Fetch it's dependencies
       *    a. Fetch their children
       * 3. Set those as our dependencies
       * 4. Fetch our actual dependencies
       * 5. Merge our actual dependencies with those from the master
       *
       * This should result in our actual dependencies showing
       */

      getInstanceMaster($scope.instance).then(function (master) {
        promisify(master, 'fetchDependencies')()
          .then(function (_masterDeps) {
            var promiseFetchMasters = _masterDeps.models.map(function (dep) {
              return getInstanceMaster(dep)
                .then(function (masterInstance) {
                  return promisify(masterInstance.children, 'fetch')()
                    .then(function () {
                      return masterInstance;
                    });
                });
            });
            return $q.all(promiseFetchMasters)
              .then(function (masters) {
                $scope.directlyRelatedMasterInstances = masters;
                // Set the dependency to be defaulted to the master
                $scope.directlyRelatedMasterInstances.forEach(function (instance) {
                  $scope.instanceDependencyMap[instance.attrs.contextVersion.context] = instance.attrs.shortHash;
                });
                return promisify($scope.instance, 'fetchDependencies')();
              })
              .then(function (_dependencies) {
                $scope.dependencies = _dependencies;
                $scope.dependencies.models.forEach(function (dependency) {
                  $scope.instanceDependencyMap[dependency.attrs.contextVersion.context] = dependency.attrs.shortHash;
                });
                $scope.masterInstancesWithChildren = $scope.directlyRelatedMasterInstances.filter(function (instance) {
                  return instance.children.models.length !== 0;
                });
                $scope.masterInstancesWithoutChildren = $scope.directlyRelatedMasterInstances.filter(function (instance) {
                  return instance.children.models.length === 0;
                });
              });
          });
      })
        .catch(errs.handler)
        .finally(function () {
          $scope.isDnsSetup = true;
        });


      $scope.getRelatedInstancesList = function () {
        return Object.keys($scope.instanceDependencyMap).map(function (key) {
          var searchShortHash = $scope.instanceDependencyMap[key];
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
        setDependency: function (masterInstance, instanceId) {
          var hostName = createInstanceUrl(masterInstance);
          if (instanceId !== masterInstance.attrs.shortHash) {
            promisify($scope.dependencies, 'create')({
              hostname: hostName,
              instance: instanceId
            })
              .catch(errs.handler);
          } else {
            var dependency = $scope.dependencies.models.find(function (dependency) {
              return dependency.attrs.contextVersion.context === masterInstance.attrs.contextVersion.context;
            });

            if (dependency) {
              dependency.destroy(errs.handler);
            }
          }
        }
      };
    }
  };
}
