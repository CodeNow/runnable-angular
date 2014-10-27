require('app')
  .directive('runnableInstanceSecondaryActions', RunnableInstanceSecondaryActions);
/**
 * @ngInject
 */
function RunnableInstanceSecondaryActions (
  async,
  QueryAssist,
  $rootScope,
  $state,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewInstanceSecondaryActions',
    replace: true,
    scope: {
      saving: '='
    },
    link: function ($scope, elem, attrs) {

      $scope.popoverGearMenu = {data:{}, actions:{}};
      $scope.popoverGearMenu.data.show = false;

      $scope.saving = false;

      $scope.goToEdit = function () {
      };

    }
  };
}
