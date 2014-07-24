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
  jQuery,
  keypather
) {
  return {
    restrict: 'A',
    scope: false, // latch on to file-tree && file-tree-dir isolate scope isolate scopes
    // scope: {},
    link: function ($scope, element, attrs) {

      $scope.jQuery = jQuery;

      var dFEMenu = $scope.dPFEMenu = {};
      var actions = dFEMenu.actions = {};

      dFEMenu.eStyle = {
        top: '0px',
        left: '0px'
      };
      dFEMenu.isOpen = false;

      actions.createFile = function () {
        var name = 'undefined';
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
        var name = 'undefined';
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
      $scope.$popoverTemplate = $scope.jQuery($template);
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

      element[0].addEventListener('contextmenu', contextMenuListener);
      function contextMenuListener (e){
        $scope.dPFEMenu.eStyle.top = e.offsetY + $scope.$popoverTemplate.height() + 'px';
        $scope.dPFEMenu.eStyle.left = e.offsetX + 'px';
        $scope.dPFEMenu.isOpen = true;

        $timeout(function () {
          $scope.$apply();
        });

        e.preventDefault();
        e.stopPropagation();
      }
      element.on('$destroy', function () {
        element[0].removeEventListener('contextmenu', contextMenuListener);
      });

    }
  };
}
