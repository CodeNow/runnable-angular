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
  $timeout
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
        data: {},
        actions: {}
      };
      $scope.popoverSaveOptions.data.restartOnSave = false;

      $scope.saving = false;

      $scope.canSave = function () {
        return !!$scope.openItems.models.find(function (model) {
          return model.state.isDirty;
        });
      };

      var overwriteStatus = null;

      $scope.changingText = function () {
        var status = $scope.instance.status();

        status = overwriteStatus || status;

        var statusMap = {
          starting: 'Starting container',
          stopping: 'Stopping Container',
          building: 'Building'
        };
        return statusMap[status];
      };

      $scope.isChanging = function () {
        return overwriteStatus || ['starting', 'building', 'stopping'].indexOf($scope.instance.status()) !== -1;
      };

      $scope.saveChanges = function () {
        $scope.saving = true;
        var stopSavingCb = callbackCount(2, function () {
          $scope.saving = false;
        });
        var updateModelPromises = $scope.openItems.models.filter(function (model) {
          return (typeof keypather.get(model, 'actions.saveChanges') === 'function');
        }).map(function (model) {
          return model.actions.saveChanges();
        });
        $timeout(stopSavingCb.next, 1500);
        $q.all(
          updateModelPromises
        ).then(function () {
          if ($scope.popoverSaveOptions.data.restartOnSave) {
            return promisify($scope.instance, 'restart')();
          }
        }).catch(
          errs.handler
        ).finally(function () {
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
          .catch(errs.handler)
          .finally(function () {
            overwriteStatus = null;
          });
      }

      $scope.actions = {
        stopInstance: function () {
          modInstance('stop');
          overwriteStatus = 'stopping';
        },
        startInstance: function () {
          modInstance('start');
          overwriteStatus = 'starting';
        }
      };
    }
  };
}
