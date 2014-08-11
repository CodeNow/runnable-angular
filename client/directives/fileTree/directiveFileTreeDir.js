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

      actions.sortDir = function () {
        $scope.dir.contents.models.sort(function (m1, m2) {
          return m1.attrs.name > m2.attrs.name;
        });
        // prevents folders/dir mixing order in tree bug
        $timeout(function(){
          $rootScope.safeApply();
          if (!$scope.readOnly) {
            actions.makeSortable();
          }
        }, 10);
      };
      actions.fetchDirFiles = fetchDirFiles;

      actions.makeSortable = function () {
        jQuery($template).find('ul').sortable();
      };

      $scope.$watch('dir.state.open', function (newVal, oldval) {
        if (newVal) {
          fetchDirFiles();
        }
      });
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
