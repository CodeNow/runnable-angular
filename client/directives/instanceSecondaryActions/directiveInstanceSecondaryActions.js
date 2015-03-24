'use strict';

require('app')
  .directive('instanceSecondaryActions', instanceSecondaryActions);
/**
 * @ngInject
 */
function instanceSecondaryActions(
  errs,
  helperInstanceActionsModal,
  $log,
  $rootScope,
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
    link: function ($scope, elem, attrs) {

      $scope.saving = false;

      $scope.popoverGearMenu = {
        data: {},
        actions: {}
      };
      $scope.popoverGearMenu.actions.stopInstance = function () {
        modInstance('stop');
      };
      $scope.popoverGearMenu.actions.startInstance = function () {
        modInstance('start');
      };
      // mutate scope, shared-multiple-states properties & logic for actions-modal
      helperInstanceActionsModal($scope);

      keypather.set($scope, 'popoverGearMenu.data.dataModalEnvironment.showRebuild', true);

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
