require('app')
  .directive('instanceSecondaryActions', instanceSecondaryActions);
/**
 * @ngInject
 */
function instanceSecondaryActions(
  helperInstanceActionsModal,
  $log,
  $rootScope,
  $state,
  $stateParams
) {
  return {
    restrict: 'E',
    templateUrl: 'viewInstanceSecondaryActions',
    replace: true,
    scope: {
      instance: '=',
      saving: '='
    },
    link: function ($scope, elem, attrs) {

      $scope.saving = false;

      $scope.popoverGearMenu = {
        data: {},
        actions: {}
      };
      $scope.popoverGearMenu.data.show = false;

      $scope.popoverGearMenu.actions.stopInstance = function () {
        modInstance('stop');
      };
      $scope.popoverGearMenu.actions.startInstance = function () {
        modInstance('start');
      };
      // mutate scope, shared-multiple-states properties & logic for actions-modal
      helperInstanceActionsModal($scope);

      $scope.popoverGearMenu.data.dataModalEnvironment.showRebuild = true;

      $scope.goToEdit = function () {
        var forkedBuild = $scope.instance.build.deepCopy(function (err) {
          if (err) { return $log.error(err); }
          $state.go('instance.instanceEdit', {
            userName: $stateParams.userName,
            instanceName: $stateParams.instanceName,
            buildId: forkedBuild.id()
          });
        });
      };

      function modInstance(action, opts) {
        $scope.loading = true;
        $scope.popoverGearMenu.data.show = false;
        $scope.instance[action](opts, function (err) {
          if (err) { throw err; }
          $scope.instance.fetch(function (err) {
            if (err) throw err;
            $scope.loading = false;
            $rootScope.safeApply();
          });
        });
        $rootScope.safeApply();
      }

    }
  };
}
