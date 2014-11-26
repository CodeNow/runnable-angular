require('app')
  .directive('instanceEditSecondaryActions', instanceEditSecondaryActions);
/**
 * @ngInject
 */
function instanceEditSecondaryActions(
  async,
  helperInstanceActionsModal,
  keypather,
  QueryAssist,
  $rootScope,
  $state,
  $stateParams,
  $timeout,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewInstanceEditSecondaryActions',
    replace: true,
    scope: {
      instance: '=',
      instances: '=',
      saving: '=',
      openItems: '='
    },
    link: function ($scope, elem, attrs) {

      $scope.popoverGearMenu = {
        data: {},
        actions: {}
      };
      $scope.popoverGearMenu.data.show = false;
      // mutate scope, shared-multiple-states properties & logic for actions-modal
      helperInstanceActionsModal($scope);
      $scope.goToInstance = function () {
        $state.go('instance.instance', $stateParams);
      };

    }
  };
}
