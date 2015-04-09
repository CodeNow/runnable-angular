'use strict';

require('app')
  .directive('dnsManager', dnsManager);
/**
 * dnsManager Directive
 * @ngInject
 */
function dnsManager(
  fetchInstances,
  createInstanceUrl,
  errs,
  promisify
) {
  return {
    restrict: 'A',
    replace: true,
    scope: {
      instance: '='
    },
    templateUrl: 'viewDnsManager',
    link: function ($scope, element, attrs) {
      // We need the entire dependency tree.
      $scope.subDependencies = [];

      // I need to know the related master pods (Master)
      $scope.relatedMasterInstances = [];

      // I need to know the dependencies for this instance keyed on context ([A:master, B:fb-1])
      $scope.instanceDependencyMap = {};

      $scope.isInitialized = false;

      // I need to know each of the master pod instances related instance A([master, fb-1]), B([master, fb-2, fb-3])
      fetchInstances({ masterPod: true })
        .then(function (instances) {
          $scope.relatedMasterInstances = instances.models.filter(function (instance) {
            return instance.attrs.contextVersion.context !== $scope.instance.attrs.contextVersion.context;
          });

          $scope.relatedMasterInstances.forEach(function (instance) {
            fetchInstances({
              'masterPod': false,
              'contextVersion.context': instance.contextVersion.attrs.context
            }).then(function (instances) {
              instance.instanceOptions = instances.models;
              instance.instanceOptions.unshift(instance);
            });

          });

          // Just a flat tree for sub dependencies
          $scope.subDependencies = [];

          // Set the dependency to be defaulted to the master
          $scope.relatedMasterInstances.forEach(function (instance) {
            $scope.instanceDependencyMap[instance.attrs.contextVersion.context] = instance.attrs.shortHash;
          });

          promisify($scope.instance, 'fetchDependencies')()
            .then(function (_dependencies) {
              $scope.dependencies = _dependencies;
              $scope.dependencies.models.forEach(function (dependency) {
                $scope.instanceDependencyMap[dependency.attrs.contextVersion.context] = dependency.attrs.shortHash;
              });

              $scope.isInitialized = true;
            })
            .catch(errs.handler);
        });

      $scope.actions = {
        setDependency: function (masterInstance, instanceId) {
          var hostName = createInstanceUrl(masterInstance);
          if (instanceId !== masterInstance.id()) {
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
