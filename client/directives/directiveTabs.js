require('app')
  .directive('tabs', tabs);
/**
 * tabs Directive
 * @ngInject
 */
function tabs(
  keypather
) {
  return {
    restrict: 'E',
    templateUrl: 'viewTabs',
    replace: true,
    scope: {
      'openFiles': '='
    },
    link: function ($scope, element, attrs) {
      var actions = $scope.actions = {};
      var data = $scope.data = {};
      data.date = Date;

      $scope.actions.getActiveFiles = function () {
        return (keypather.get($scope, 'buildFiles.getActiveFiles()') || []);
      };

      $scope.actions.getLastActiveFileTime = function () {
        return (keypather.get($scope, 'buildFiles.getLastActiveFileTime()') || 0);
      };

    }
  };
}
