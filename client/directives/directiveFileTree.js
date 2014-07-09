require('app')
  .directive('fileTree', fileTreeFactory);
/**
 * fileTree Directive
 * @ngInject
 */
function fileTreeFactory () {
  return {
    restrict: 'E',
    templateUrl: 'viewFileTree',
    replace: true,
    scope: {
      'buildFiles': '='
    },
    link: function ($scope, element, attrs) {
      var actions = $scope.actions = {};
      var data = $scope.data = {};
      data.date = Date;

      // file can be dir or file
      actions.clickFile = function (file) {
      };

      $scope.actions.getActiveFiles = function () {
        return (keypather.get($scope, 'buildFiles.getActiveFiles()') || []);
      };

      $scope.actions.getLastActiveFileTime = function () {
        return (keypather.get($scope, 'buildFiles.getLastActiveFileTime()') || 0);
      };

    }
  };
}
