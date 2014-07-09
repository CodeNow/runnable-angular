require('app')
  .directive('fileTree', fileTree);
/**
 * fileTree Directive
 * @ngInject
 */
function fileTree (
  keypather
) {
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

      actions.togglePopover = function (popoverName, event) {
        var popovers = [
          'FileMenu'
        ];
        if (angular.isFunction(keypather.get(event, 'stopPropagation'))) {
          event.stopPropagation();
        }
        if (typeof popoverName !== 'string' && typeof popoverName !== 'undefined') {
          throw new Error('invalid argument: ' + (typeof popoverName));
        } else if (typeof popoverName === 'string' && popovers.indexOf(popoverName) === -1) {
          throw new Error('invalid argument: ' + popoverName);
        }
        if (typeof popoverName === 'string') {
          data['show' + popoverName] = true;
        } else {
          data.showFileMenu = false;
        }
      };

      $scope.$on('app-document-click', function () {
        actions.togglePopover();
      });

      $scope.actions.getActiveFiles = function () {
        return (keypather.get($scope, 'buildFiles.getActiveFiles()') || []);
      };

      $scope.actions.getLastActiveFileTime = function () {
        return (keypather.get($scope, 'buildFiles.getLastActiveFileTime()') || 0);
      };

    }
  };
}
