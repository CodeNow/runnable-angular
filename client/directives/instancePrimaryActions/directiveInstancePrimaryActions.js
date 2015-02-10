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
    restrict: 'E',
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
      $scope.popoverSaveOptions.data.show = false;
      $scope.popoverSaveOptions.data.restartOnSave = false;

      $scope.saving = false;
      $scope.loading = false;

      $scope.saveChanges = function () {
        $scope.saving = true;
        var stopSavingCb = callbackCount(2, function () {
          $scope.saving = false;
        });
        var updateModelPromises = $scope.openItems.models.filter(function (model) {
          if (typeof keypather.get(model, 'attrs.body') !== 'string') {
            return false;
          }
          return (model.attrs.body !== model.state.body);
        }).map(function (model) {
          return promisify(model, 'update')({
            json: {
              body: model.state.body
            }
          });
        });
        $timeout(stopSavingCb.next, 1500);
        $q.all(
          updateModelPromises
        ).then(function () {
          if ($scope.popoverSaveOptions.data.restartOnSave) {
            return promisify($scope.instance, 'restart')();
          } else {
            return true;
          }
        }).catch(
          errs.handler
        ).finally(function () {
          stopSavingCb.next();
        });
      };
    }
  };
}
