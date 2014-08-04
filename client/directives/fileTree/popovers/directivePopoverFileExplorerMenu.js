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
    link: function ($scope, element, attrs) {
      if ($scope.readOnly) {
        return;
      }
      $scope.jQuery = jQuery;
      var dFEMenu = $scope.dPFEMenu = {};
      var actions = dFEMenu.actions = {};

      dFEMenu.eStyle = {
        top: '0px',
        left: '0px'
      };
      dFEMenu.isOpen = false;

      actions.getNewName = function (findForDir) {
        var regexp1 = /^undefined$/;
        var regexp2 = /^undefined \([0-9]+\)$/;

        var models = $scope.dir.contents.models
          .slice()
          .filter(function (model) {
            // verify model is correct type and has undefined name
            return (findForDir === model.attrs.isDir) &&
              regexp1.test(model.attrs.name) &&
                regexp2.test(model.attrs.name);
          })
          .sort(function (m1, m2) {
            var n1 = m1.match(/[0-9]+/);
            var n2 = m2.match(/[0-9]+/);
            if (n1 === null) {
              n1 = -1;
            }
            if (n2 === null) {
              n2 = -1;
            }
            n1 = parseInt(n1[0]);
            n2 = parseInt(n2[0]);
            return n1 -  n2;
          });
      };

      actions.createFile = function () {
        this.getNewName(true);
        var name = 'undefined';
        $scope.dir.contents.create({
          name: name,
          path: $scope.dir.attrs.path,
          isDir: false
        }, function () {
          $scope.dir.contents.fetch(function () {
            $rootScope.safeApply();
          });
        });
      };

      actions.createFolder = function () {
        var name = 'undefined';
        $scope.dir.contents.create({
          name: name,
          path: $scope.dir.attrs.path,
          isDir: true
        }, function () {
          $scope.dir.contents.fetch(function () {
            $rootScope.safeApply();
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
        if (e.currentTarget !== e.target) {
          return false;
        }
        $scope.dPFEMenu.eStyle.top = e.pageY - 18 + 'px';
        $scope.dPFEMenu.eStyle.left = e.pageX + 'px';
        $scope.dPFEMenu.isOpen = true;

        $rootScope.safeApply();

        e.preventDefault();
        e.stopPropagation();
      }
      element.on('$destroy', function () {
        $scope.$popoverTemplate.remove();
        element[0].removeEventListener('contextmenu', contextMenuListener);
      });

    }
  };
}
