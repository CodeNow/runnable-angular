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
  $q,
  getInstanceClasses,
  $localStorage
) {
  return {
    restrict: 'A',
    scope: {
      instance: '=',
      isDnsSetup: '='
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

      // I need to know each of the master pod instances related instance A([master, fb-1]), B([master, fb-2, fb-3])
      fetchInstances({ masterPod: true })
        .then(function (instances) {
          $scope.directlyRelatedMasterInstances = instances.models.filter(function (instance) {
            return instance.attrs.contextVersion.context !== $scope.instance.attrs.contextVersion.context;
          });

          var promiseList = $scope.directlyRelatedMasterInstances.map(function (instance) {
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
          $scope.directlyRelatedMasterInstances.forEach(function (instance) {
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
            $scope.isDnsSetup = true;
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
