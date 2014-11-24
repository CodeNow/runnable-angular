require('app')
  .directive('modalEnvironment', modalEnvironment);
/**
 * directive modalEnvironment
 * @ngInject
 */
function modalEnvironment(
  $localStorage,
  keypather
) {
  return {
    restrict: 'E',
    templateUrl: 'viewModalEnvironment',
    replace: true,
    scope: {
      data: '=',
      currentModel: '=',
      stateModel: '=',
      actions: '=',
      defaultActions: '='
    },
    link: function ($scope, element, attrs) {
      // Add thing
      $scope.validation = {};
      $scope.tempModel = {};

      $scope.pasteLinkedInstance = function (text, port) {
        $scope.$broadcast('eventPasteLinkedInstance', text + ':' + port);
      };
      $scope.data.hideGuideHelpEnvModal =
          keypather.get($localStorage, 'guides.hideGuideHelpEnvModal') || false;

      $scope.onChangeHideGuideEnv = function () {
        $scope.data.hideGuideHelpEnvModal = true;
        keypather.set($localStorage, 'guides.hideGuideHelpEnvModal', true);
      };
    }
  };
}