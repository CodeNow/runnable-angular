require('app')
  .directive('modalEnvironment', modalEnvironment);
/**
 * directive modalEnvironment
 * @ngInject
 */
function modalEnvironment(
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

      $scope.$on('$destroy', function () {
      });
    }
  };
}