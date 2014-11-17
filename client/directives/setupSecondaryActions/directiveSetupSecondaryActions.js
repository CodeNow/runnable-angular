require('app')
  .directive('setupSecondaryActions', setupSecondaryActions);
/**
 * @ngInject
 */
function setupSecondaryActions(
) {
  return {
    restrict: 'E',
    templateUrl: 'viewSetupSecondaryActions',
    replace: true,
    scope: {
      saving: '=',
      stateModel: '='
    },
    link: function ($scope, elem, attrs) {

    }
  };
}
