'use strict';

require('app')
  .directive('instancePrimaryActions', instancePrimaryActions);
/**
 * @ngInject
 */
function instancePrimaryActions(
  async,
  keypather,
  callbackCount,
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
        // weird hackiness to get the saving spinner to display

        $scope.saving = true;
        var stopSavingCb = callbackCount(2, function () {
          $scope.saving = false;
        });
        var updateModels = $scope.openItems.models
          .filter(function (model) {
            if (typeof keypather.get(model, 'attrs.body') !== 'string') {
              return false;
            }
            return (model.attrs.body !== model.state.body);
          });
        $timeout(stopSavingCb.next, 1500);
        async.each(
          updateModels,
          function iterate(file, cb) {
            file.update({
              json: {
                body: file.state.body
              }
            }, function (err) {
              if (err) {
                throw err;
              }
              cb();
            });
          },
          function complete(err) {
            stopSavingCb.next();
            if ($scope.popoverSaveOptions.data.restartOnSave) {
              $scope.instance.restart(function(err) {
                if (err) { throw err; }
                $scope.instance.fetch(function(err) {
                  if (err) { throw err; }
                });
              });
              // need container !running here
              keypather.set($scope.instance,
                'containers.models[0].attrs.inspect.State.Running', false);
            }
          }
        );
      };

    }
  };
}
