require('app')
  .directive('tabs', tabsFactory);
/**
 * tabs Directive
 * @ngInject
 */
function tabsFactory (
  keypather
) {
  return {
    restrict: 'E',
    templateUrl: 'viewTabs',
    replace: true,
    scope: {
      'buildFiles': '='
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
