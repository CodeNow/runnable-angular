require('app')
  .directive('setupSecondaryActions', setupSecondaryActions);
/**
 * @ngInject
 */
function setupSecondaryActions(
  keypather
) {
  return {
    restrict: 'E',
    templateUrl: 'viewSetupSecondaryActions',
    replace: true,
    scope: {
      saving: '=',
      stateModel: '=',
      currentModel: '='
    },
    link: function ($scope, elem, attrs) {
      $scope.data = {};
      keypather.set($scope, 'actions.actionsModalEnvironment', {
        save: function () {
          $scope.actions.actionsModalEnvironment.close();
        }
      });
    }
  };
}
