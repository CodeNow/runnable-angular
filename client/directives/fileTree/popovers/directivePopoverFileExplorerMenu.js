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

      function getNewName(collection, findForDir) {
        var regexp1 = /^undefined$/;
        var regexp2 = /^undefined \([0-9]+\)$/;

        var models = collection.models
          .slice()
          .filter(function (model) {
            // verify model is correct type and has undefined name
            return (findForDir === model.attrs.isDir) &&
              regexp1.test(model.attrs.name) &&
                regexp2.test(model.attrs.name);
          })
          .sort(function (m1, m2) {
            if (regexp1.test(m1)) {
              return true;
            } else if (regexp1.test(m2)) {
              return false;
            }

          });

      }

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
      //element.prepend($template);
      $scope.jQuery('body').append($template);

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
        $scope.dPFEMenu.eStyle.top = e.pageY - 18 + 'px';
        $scope.dPFEMenu.eStyle.left = e.pageX + 'px';
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
