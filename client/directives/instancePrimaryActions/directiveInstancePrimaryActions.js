'use strict';

require('app')
  .directive('instancePrimaryActions', instancePrimaryActions);
/**
 * @ngInject
 */
function instancePrimaryActions(
  callbackCount,
  errs,
  keypather,
  promisify,
  $q,
  $timeout,
  updateInstanceWithNewBuild,
  loading
) {
  return {
    restrict: 'A',
    templateUrl: 'viewInstancePrimaryActions',
    scope: {
      loading: '=',
      instance: '=',
      saving: '=',
      openItems: '='
    },
    link: function ($scope, elem, attrs) {

      $scope.popoverSaveOptions = {
        data: {
          show: false,
          restartOnSave: false
        },
        actions: {}
      };
      $scope.popoverSaveOptions.data.restartOnSave = false;

      $scope.saving = false;

      $scope.canSave = function () {
        return !!$scope.openItems.models.find(function (model) {
          return model.state.isDirty;
        });
      };

      $scope.changingText = function () {
        var status = keypather.get($scope, 'instance.status()');

        var statusMap = {
          starting: 'Starting container',
          stopping: 'Stopping Container',
          building: 'Building'
        };
        return statusMap[status];
      };

      $scope.isChanging = function () {
        var status = keypather.get($scope, 'instance.status()');
        return ['starting', 'building', 'stopping'].includes(status);
      };

      $scope.saveChanges = function () {
        $scope.saving = true;
        var stopSavingCb = callbackCount(2, function () {
          $scope.saving = false;
        });
        var updateModelPromises = $scope.openItems.models
          .filter(function (model) {
            return (typeof keypather.get(model, 'actions.saveChanges') === 'function');
          })
          .map(function (model) {
            return model.actions.saveChanges();
          });
        $timeout(stopSavingCb.next, 1500);
        $q.all(updateModelPromises)
          .then(function () {
            if ($scope.popoverSaveOptions.data.restartOnSave) {
              return promisify($scope.instance, 'restart')();
            }
          })
          .catch(errs.handler)
          .finally(function () {
            stopSavingCb.next();
          });
      };

      function modInstance(action, opts) {
        $scope.$broadcast('close-popovers');
        promisify($scope.instance, action)(
          opts
        )
          .then(function () {
            return promisify($scope.instance, 'fetch')();
          })
          .catch(errs.handler);
      }

      $scope.popoverStatusOptions = {
        actions: {
          stopInstance: function () {
            modInstance('stop');
          },
          startInstance: function () {
            modInstance('start');
          },
          restartInstance: function () {
            modInstance('restart');
          },
          rebuildWithoutCache: function () {
            loading('main', true);
            promisify($scope.instance.build, 'deepCopy')()
              .then(function (build) {
                return updateInstanceWithNewBuild(
                  $scope.instance,
                  build,
                  true
                );
              })
              .catch(errs.handler)
              .finally(function () {
                loading('main', false);
              });


          },
          updateConfigToMatchMaster: function () {
            $scope.popoverStatusOptions.data.shouldShowUpdateConfigsPrompt = false;
            loading('main', true);
            var instanceUpdates = {};
            promisify($scope.instance, 'fetchMasterPod', true)()
              .then(function (masterPodInstances) {
                var masterPodInstance = masterPodInstances.models[0];
                instanceUpdates.masterPodInstance = masterPodInstance;
                instanceUpdates.opts = {
                  env: masterPodInstance.attrs.env
                };
                return promisify(instanceUpdates.masterPodInstance.build, 'deepCopy')();
              })
              .then(function (build) {
                instanceUpdates.build = build;
                instanceUpdates.contextVersion = build.contextVersions.models[0];
                return promisify(instanceUpdates.contextVersion, 'fetch')();
              })
              .then(function () {
                var currentAcvAttrs = $scope.instance.contextVersion.getMainAppCodeVersion().attrs;
                // Delete the transformRules, since we don't want to update what Master had
                delete currentAcvAttrs.transformRules;
                return promisify(
                  instanceUpdates.contextVersion.getMainAppCodeVersion(),
                  'update'
                )($scope.instance.contextVersion.getMainAppCodeVersion().attrs);
              })
              .then(function () {
                return updateInstanceWithNewBuild(
                  $scope.instance,
                  instanceUpdates.build,
                  true,
                  instanceUpdates.opts
                );
              })
              .catch(errs.handler)
              .finally(function () {
                loading('main', false);
              });
          }
        },
        data: {
          shouldShowUpdateConfigsPrompt: false,
          instance: $scope.instance
        }
      };

      $scope.$watch('instance.configStatusValid', function (configStatusValid) {
        if ($scope.instance) {
          if (configStatusValid === false) {
            // This will cause the valid flag to flip, recalling this watcher
            return promisify($scope.instance, 'fetchParentConfigStatus')()
              .catch(errs.handler);
          } else {
            $scope.popoverStatusOptions.data.shouldShowUpdateConfigsPrompt = !$scope.instance.cachedConfigStatus;
          }
        }
      });

      $scope.getClassForInstance = function () {
        var status = keypather.get($scope, 'instance.status()');

        var classes = [];
        if (['running', 'stopped','building', 'starting', 'stopping', 'neverStarted', 'unknown'].includes(status)){
          classes.push('gray');
        } else if (['crashed', 'buildFailed'].includes(status)){
          classes.push('red');
        }

        if (['building', 'starting', 'stopping'].includes(status)){
          classes.push('in');
        }
        return classes;
      };
    }
  };
}
