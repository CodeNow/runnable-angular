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
  $rootScope
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

      actions.closeOpenModals = function () {
        $rootScope.$broadcast('app-document-click');
      };

      // http://www.bennadel.com/blog/2495-user-friendly-sort-of-alpha-numeric-data-in-javascript.htm
      function normalizeMixedDataValue(value) {
        var padding = '000000000000000';
        // Loop over all numeric values in the string and
        // replace them with a value of a fixed-width for
        // both leading (integer) and trailing (decimal)
        // padded zeroes.
        value = value.replace(
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

      actions.sortDir = function () {
        $scope.dir.contents.models.sort(function (m1, m2) {
          var s1 = normalizeMixedDataValue(m1.attrs.name);
          var s2 = normalizeMixedDataValue(m2.attrs.name);
          if (s1 < s2) {
            return -1;
          } else if (s1 > s2) {
            return 1;
          } else {
            return 0;
          }

        });
        // prevents folders/dir mixing order in tree bug
        $timeout(function () {
          $rootScope.safeApply();
          if (!$scope.readOnly) {
            actions.makeSortable();
          }
        }, 10);
      };

      actions.makeSortable = function () {
        var $t = jQuery($template);
      };

      $scope.$watch('dir.state.open', function (newVal, oldval) {
        if (newVal) {
          fetchDirFiles();
        }
      });

      $scope.$watch('dir.contents.models', function (newVal) {
        if (newVal) {
          actions.sortDir();
        }
      });

      actions.fetchDirFiles = fetchDirFiles;
      function fetchDirFiles() {
        $scope.dir.contents.fetch(function (err) {
          if (err) {
            throw err;
          }
          actions.sortDir();
          actions.makeSortable();
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
