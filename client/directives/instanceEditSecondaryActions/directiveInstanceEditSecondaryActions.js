'use strict';

require('app')
  .directive('instanceEditSecondaryActions', instanceEditSecondaryActions);
/**
 * @ngInject
 */
function instanceEditSecondaryActions(
  helperInstanceActionsModal,
  $state,
  $stateParams
) {
  return {
    restrict: 'E',
    templateUrl: 'viewInstanceEditSecondaryActions',
    scope: {
      instance: '=',
      instances: '=', // Added to the data scope of the modals through helper
      saving: '='
    },
    link: function ($scope) {

      $scope.popoverGearMenu = {
        data: {},
        actions: {}
      };
      // mutate scope, shared-multiple-states properties & logic for actions-modal
      helperInstanceActionsModal($scope);
      $scope.goToInstance = function () {
        $state.go('instance.instance', $stateParams);
      };

    }
  };
}
