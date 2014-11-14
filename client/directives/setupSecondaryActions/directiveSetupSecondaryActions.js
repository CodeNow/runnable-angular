require('app')
  .directive('setupSecondaryActions', setupSecondaryActions);
/**
 * @ngInject
 */
function setupSecondaryActions(
  async,
  helperInstanceActionsModal,
  QueryAssist,
  $rootScope,
  $state,
  $stateParams,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewSetupSecondaryActions',
    replace: true,
    scope: {
      saving: '='
    },
    link: function ($scope, elem, attrs) {

    }
  };
}
