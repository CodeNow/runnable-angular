var $ = require('jquery');
require('app')
  .directive('popoverFileExplorerMenu', popoverFileExplorerMenu);
/**
 * directive popoverFileExplorerMenu
 * @ngInject
 */
function popoverFileExplorerMenu(
  $templateCache,
  $compile,
  $timeout,
  $rootScope,
  keypather
) {
  return {
    restrict: 'A',
    scope: false, // latch on to file-tree && file-tree-dir isolate scope
    // scope: {},
    link: function ($scope, element, attrs) {

      window.ss = $scope;
      var clickPos = $rootScope.UTIL.clickPos;
      var dFEMenu = $scope.dPFEMenu = {};
      var actions = dFEMenu.actions = {};

      dFEMenu.eStyle = {
        top: '0px',
        left: '0px'
      };

      dFEMenu.isOpen = false;

      actions.createFile = function () {
        var name = prompt('filename?');
        if (!name) {
          return;
        }
        $scope.version.createFile({
          name: name,
          path: $scope.dir.filepath(),
          isDir: false
        }, function () {
          $scope.version.fetchFiles({
            path: $scope.dir.filepath()
          }, function () {
            $timeout(function () {
              $scope.$apply();
            });
          });
        });
      };
      actions.createFolder = function () {
        var name = prompt('dirname?');
        if (!name) {
          return;
        }
        $scope.version.createFile({
          name: name,
          path: $scope.dir.filepath(),
          isDir: true
        }, function () {
          $scope.version.fetchFiles({
            path: $scope.dir.filepath()
          }, function () {
            $timeout(function () {
              $scope.$apply();
            });
          });
        });
      };

      // insert element into dom
      var template = $templateCache.get('viewFileTreePopoverFileExplorerMenu');
      var $template = angular.element(template);
      $compile($template)($scope);
      element.prepend($template);

      $scope.$on('file-modal-open', function () {
        if (dFEMenu.isOpen) {
          dFEMenu.isOpen = false;
        }
      });
      $scope.$on('app-document-click', function () {
        if (dFEMenu.isOpen) {
          dFEMenu.isOpen = false;
        }
      });

      // element.bind('mousedown', clickHandler);
      element[0].addEventListener('contextmenu', function(e){
        $scope.dPFEMenu.eStyle.top = e.offsetY+'px';
        $scope.dPFEMenu.eStyle.left = e.offsetX+'px';
        $scope.dPFEMenu.isOpen = true;

        $timeout(function () {
          $scope.$apply();
        });

        e.preventDefault();
        e.stopPropagation();
      });

      element.on('$destroy', function () {
        element.off('contextmenu');
      });

    }
  };
}
