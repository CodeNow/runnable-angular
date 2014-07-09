require('app')
  .directive('tabsDropdown', factoryTabsDropdown);
/**
 * tabsDropdown Directive
 * @ngInject
 */
function factoryTabsDropdown (
  keypather
) {
  return {
    restrict: 'E',
    templateUrl: 'viewTabsDropdown',
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
