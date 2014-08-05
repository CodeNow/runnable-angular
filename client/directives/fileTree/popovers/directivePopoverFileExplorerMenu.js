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

      actions.getNewName = function () {
        var regexp1 = /^undefined$/;
        var regexp2 = /^undefined \([0-9]+\)$/;

        var names = $scope.dir.contents.models
          .map(function (model) {
            return model.attrs.name;
          })
          .filter(function (name) {
            // verify model is correct type and has undefined name
            return regexp1.test(name) || regexp2.test(name);
          })
          .sort(function (m1, m2) {
            var n1 = m1.match(/[0-9]+/);
            var n2 = m2.match(/[0-9]+/);
            if (n1 === null) {
              n1 = ['0'];
            }
            if (n2 === null) {
              n2 = ['0'];
            }
            n1 = parseInt(n1[0]);
            n2 = parseInt(n2[0]);
            return n1 - n2;
          });

        // let would be nice
        var index = -1;
        for (var i=0, len=names.length; i < len; i++) {
          if (names[i] === 'undefined') {
            index = 0;
          } else {
            index = parseInt(names[i].match(/[0-9]+/)[0]);
          }
          // find skipped indexes
          if (index > i) {
            index = i - 1;
            break;
          }
        }

        var name = 'undefined';
        index++;
        if (index > 0) {
          name += ' (' + index + ')';
        }

        return name;
      };

      actions.createFile = function () {
        var name = this.getNewName();
        $scope.dir.contents.create({
          name: name,
          path: $scope.dir.attrs.path,
          isDir: false
        }, function () {
          dFEMenu.isOpen = false;
          $rootScope.safeApply();
          $scope.dir.contents.fetch(function () {
            $rootScope.safeApply();
          });
        });
      };

      actions.createFolder = function () {
        var name = this.getNewName();
        $scope.dir.contents.create({
          name: name,
          path: $scope.dir.attrs.path,
          isDir: true
        }, function () {
          dFEMenu.isOpen = false;
          $rootScope.safeApply();
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
