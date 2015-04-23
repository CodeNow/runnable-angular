'use strict';

require('app')
  .directive('instanceSecondaryActions', instanceSecondaryActions);
/**
 * @ngInject
 */
function instanceSecondaryActions(
  errs,
  $state,
  keypather,
  $stateParams,
  promisify
) {
  return {
    restrict: 'A',
    templateUrl: 'viewInstanceSecondaryActions',
    scope: {
      instance: '=',
      instances: '=',
      saving: '='
    },
    link: function ($scope) {

      $scope.saving = false;

      $scope.actions = {
        stopInstance: function () {
          modInstance('stop');
        },
        startInstance: function () {
          modInstance('start');
        }
      };

      $scope.goToEdit = function () {
        promisify($scope.instance.build, 'deepCopy')(
        ).then(function (forkedBuild) {
          $state.go('instance.instanceEdit', {
            userName: $stateParams.userName,
            instanceName: $stateParams.instanceName,
            buildId: forkedBuild.id()
          });
        }).catch(errs.handler);
      };

      function modInstance(action, opts) {
        $scope.saving = true;
        $scope.$broadcast('close-popovers');
        promisify($scope.instance, action)(
          opts
        ).then(function () {
          return promisify($scope.instance, 'fetch')();
        }).catch(
          errs.handler
        ).finally(function () {
          $scope.saving = false;
        });
      }
    }
  };
}
