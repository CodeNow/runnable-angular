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
  promisify,
  $q
) {
  return {
    restrict: 'A',
    scope: {
      instance: '=',
      dnsSetup: '='
    },
    templateUrl: 'viewDnsManager',
    link: function ($scope, element, attrs) {
      // We need the entire dependency tree.
      $scope.subDependencies = [];

      // I need to know the related master pods (Master)
      $scope.relatedMasterInstances = [];

      // I need to know the dependencies for this instance keyed on context ([A:master, B:fb-1])
      $scope.instanceDependencyMap = {};

      $scope.dnsSetup = false;

      // I need to know each of the master pod instances related instance A([master, fb-1]), B([master, fb-2, fb-3])
      fetchInstances({ masterPod: true })
        .then(function (instances) {
          $scope.relatedMasterInstances = instances.models.filter(function (instance) {
            return instance.attrs.contextVersion.context !== $scope.instance.attrs.contextVersion.context;
          });

          var promiseList = $scope.relatedMasterInstances.map(function (instance) {
            return fetchInstances({
              masterPod: false,
              'contextVersion.context': instance.attrs.contextVersion.context
            })
              .then(function (instances) {
                instance.instanceOptions = [instance].concat(instances.models);
              });
          });

          // Just a flat tree for sub dependencies
          $scope.subDependencies = [];

          // Set the dependency to be defaulted to the master
          $scope.relatedMasterInstances.forEach(function (instance) {
            $scope.instanceDependencyMap[instance.attrs.contextVersion.context] = instance.attrs.shortHash;
          });

          promiseList.push(promisify($scope.instance, 'fetchDependencies')()
            .then(function (_dependencies) {
              $scope.dependencies = _dependencies;
              $scope.dependencies.models.forEach(function (dependency) {
                $scope.instanceDependencyMap[dependency.attrs.contextVersion.context] = dependency.attrs.shortHash;
              });
            }));

          return $q.all(promiseList).then(function () {
            $scope.dnsSetup = true;
          });
        })
        .catch(errs.handler);

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
