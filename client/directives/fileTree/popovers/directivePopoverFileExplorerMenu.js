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
    scope: false,
    // templateUrl: 'viewFileTreePopoverFileExplorerMenu',
    link: function ($scope, element, attrs) {

      var clickPos = $rootScope.UTIL.clickPos;
      var dFEMenu = $scope.dPFEMenu = {};
      var actions = dFEMenu.actions = {};
      dFEMenu.eStyle = {
        position: 'fixed',
        top: '10px',
        left: '10px',
        display: 'block'
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

      var clickHandler = function (event) {
        if (event.which !== 3) {
          // not right click
          return;
        }
        if (angular.isFunction(keypather.get(event, 'stopPropagation'))) {
          event.stopPropagation();
        }
        // first close othe
        $rootScope.$broadcast('file-modal-open');
        dFEMenu.isOpen = true;
        var pos = clickPos(event);
        $timeout(function () {
          $scope.$apply();
        });
        return false;
      };

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
      element.bind('mousedown', clickHandler);
      element.on('$destroy', function () {
        element.off('contextmenu');
      });

    }
  };
}
