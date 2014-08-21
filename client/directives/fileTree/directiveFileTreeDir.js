var jQuery = require('jquery');
require('jquery-ui');

require('app')
  .directive('fileTreeDir', fileTreeDir);
/**
 * fileTreeDir Directive
 * @ngInject
 */
function fileTreeDir(
  $templateCache,
  $compile,
  $timeout,
  $rootScope,
  $state
) {
  return {
    restrict: 'E',
    scope: {
      dir: '=',
      openItems: '=',
      readOnly: '='
    },
    template: '',
    link: function ($scope, element, attrs) {

      var jQuery = require('jquery');
      var actions = $scope.actions = {};
      var data = $scope.data = {};
      $scope.state = $state;

      actions.closeOpenModals = function () {
        $rootScope.$broadcast('app-document-click');
      };

      actions.openFile = function (file) {
        if (data.dragging) {
          data.dragging = false;
          return;
        }
        $scope.openItems.add(file);
      };

      // http://www.bennadel.com/blog/2495-user-friendly-sort-of-alpha-numeric-data-in-javascript.htm
      function normalizeMixedDataValue(file) {
        var padding = '000000000000000';
        // Loop over all numeric values in the string and
        // replace them with a value of a fixed-width for
        // both leading (integer) and trailing (decimal)
        // padded zeroes.
        value = file.attrs.name.replace(
          /(\d+)((\.\d+)+)?/g,
          function($0, integer, decimal, $3) {
            if (decimal !== $3) {
              return(
                padding.slice(integer.length) +
                integer +
                decimal
              );
            }
            decimal = (decimal || ".0");
            return(
              padding.slice(integer.length) +
              integer +
              decimal +
              padding.slice(decimal.length)
            );
          }
        );
        return value;
      }
      actions.normalizeMixedDataValue = normalizeMixedDataValue;

      actions.makeSortable = function () {
        var $t = jQuery($template);
        $t.find('> ul > li.file').draggable({
          revert: 'invalid',
          revertDuration: 100,
          drag: function () {
            data.dragging = true;
          }
        });
        $t.droppable({
          greedy: true,
          drop: function (event, item) {
            var file = angular.element(item.draggable).scope().fs;
            file.moveToDir($scope.dir);
            $rootScope.safeApply(function () {
              actions.makeSortable();
            });
          },
        });
      };

      $scope.$watch('dir.state.open', function (newVal, oldval) {
        if (newVal) {
          fetchDirFiles();
        }
      });

      actions.fetchDirFiles = fetchDirFiles;
      function fetchDirFiles() {
        $scope.dir.contents.fetch(function (err) {
          $rootScope.safeApply(function () {
            if (!$scope.readOnly) {
              actions.makeSortable();
            }
          });
          if (err) {
            throw err;
          }
        });
      }

      // avoid infinite loop w/ nested directories
      var template = $templateCache.get('viewFileTreeDir');
      var $template = angular.element(template);
      $compile($template)($scope);
      element.replaceWith($template);

      element.on('$destroy', function () {
        // IF BIND ANY EVENTS TO DOM, UNBIND HERE OR SUFFER THE MEMORY LEAKS
      });
    }
  };
}
