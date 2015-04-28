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
  fetchInstances,
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

      getInstanceMaster($scope.instance).then(function (master) {
        promisify(master, 'fetchDependencies')().then(function (_masterDeps) {

          var promiseFetchMasters = _masterDeps.map(function (dep) {
            return getInstanceMaster(dep);
          });
          $q.all(promiseFetchMasters).then(function (masters) {
            $scope.directlyRelatedMasterInstances = masters;
            // Set the dependency to be defaulted to the master
            $scope.directlyRelatedMasterInstances.forEach(function (instance) {
              $scope.instanceDependencyMap[instance.attrs.contextVersion.context] = instance.attrs.shortHash;
            });

            var promiseList = [];
            promiseList.push(promisify($scope.instance, 'fetchDependencies')()
              .then(function (_dependencies) {
                $scope.dependencies = _dependencies;
                $scope.dependencies.models.forEach(function (dependency) {
                  $scope.instanceDependencyMap[dependency.attrs.contextVersion.context] = dependency.attrs.shortHash;
                });
              }));

            return $q.all(promiseList).then(function () {
              $scope.masterInstancesWithChildren = $scope.directlyRelatedMasterInstances.filter(function (instance) {
                return instance.children.models.length !== 0;
              });
              $scope.masterInstancesWithoutChildren = $scope.directlyRelatedMasterInstances.filter(function (instance) {
                return instance.children.models.length === 0;
              });

              $scope.isDnsSetup = true;
            });
          });
        });
      }).catch(errs.handler);

      $scope.actions = {
        setDependency: function (masterInstance, instanceId) {
          var hostName = createInstanceUrl(masterInstance);
          if (instanceId !== masterInstance.attrs.shortHash) {
            $scope.dependencies.create({
              hostname: hostName,
              instance: instanceId
            }, errs.handler);
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
