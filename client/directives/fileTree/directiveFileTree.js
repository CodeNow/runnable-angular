require('app')
  .directive('fileTree', fileTree);
/**
 * fileTree Directive
 * @ngInject
 */
function fileTree(
  $timeout,
  keypather
) {
  return {
    restrict: 'E',
    templateUrl: 'viewFileTree',
    replace: true,
    scope: {
      version: '=',
      openFiles: '='
    },
    link: function ($scope, element, attrs) {
      var actions = $scope.actions = {};
      var data = $scope.data = {};
      data.date = Date;

      function init () {
        data.rootDir = $scope.version.newDir({
          id: $scope.version.id()+'newdir',
          isDir: true,
          Key: (new Array(31).join(' ')) + '//' // bs for now
        }, {
          idAttribute: 'id'
        });
      }
      $scope.$watch('version.attrs.owner', function (newval, oldval) {
        if (newval) {
          init();
        }
      });

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

      actions.createFile = function () {
        var file = $scope.version.createFile({
          name: 'untitled' + Math.ceil((Math.random() * 100000)),
          path: '/',
          body: ''
        }, function () {});
        var coll = $scope.version.fetchFiles(function () {});
        coll.add(file);
        $timeout(function () {
          $scope.$apply();
        });
      };

      $scope.$on('app-document-click', function () {
        actions.togglePopover();
      });
/*j
      $scope.actions.getActiveFiles = function () {
        return (keypather.get($scope, 'buildFiles.getActiveFiles()') || []);
      };

      $scope.actions.getLastActiveFileTime = function () {
        return (keypather.get($scope, 'buildFiles.getLastActiveFileTime()') || 0);
      };
*/

    }
  };
}
