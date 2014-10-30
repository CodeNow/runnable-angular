var $ = require('jquery'); // required by brace
require('brace');
require('brace/ext/modelist');
require('brace/ext/searchbox');
require('lib/braceModes');

require('app')
  .directive('activePanel', activePanel);
/**
 * activePanel Directive
 * @ngInject
 */
function activePanel(
  async,
  debounce,
  keypather,
  modelist,
  QueryAssist,
  $rootScope,
  $sce,
  $stateParams,
  $timeout,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewActivePanel',
    replace: true,
    scope: {
      isDarkTheme: '=',
      instance: '=',
      build: '=',
      container: '=',
      openItems: '=',
      readOnly: '=',
      update: '=' // true: save file when content changes
    },
    link: function ($scope, element, attrs) {

      var data = $scope.data = {};
      var actions = $scope.actions = {};
      data.readOnly = $scope.readOnly;

      actions.onFocus = function () {
        $rootScope.$broadcast('app-document-click');
      };

      // Wrapper function so we can call setAceMode with both
      //   item *and* _editor
      actions.wrapWithItem = function (item) {
        return function (_editor) {
          actions.setAceMode(_editor, item);
        };
      };

      actions.setAceMode = function (_editor, item) {
        var name = keypather.get(item, 'attrs.name');
        if (name) {
          var mode = modelist.getModeForPath(name).mode;
          _editor.getSession().setMode(mode);
        }
      };

      // allow iframe to load url
      $scope.$sce = $sce;

      var skip = true;

      function updateFile(cb) {
        if (skip) {
          skip = false;
          return;
        }
        var activeFile = $scope.openItems.activeHistory.last();
        if (!$scope.openItems.isFile(activeFile)) {
          return;
        }
        activeFile.update({
          json: {
            body: activeFile.state.body
          }
        }, function (err) {
          if (err) {
            throw err;
          }
          $rootScope.safeApply();
        });
      }
      var updateFileDebounce = debounce(updateFile, 333);

      function fetchFile() {
        var openItems = $scope.openItems;
        var last = openItems.activeHistory.last();
        if (openItems.isFile(last)) {
          last.fetch(function () {
            last.state.reset();
            $rootScope.safeApply();
          });
        }
      }

      $scope.$watch('openItems.activeHistory.last().state.body', function (newVal, oldVal) {
        if (typeof newVal === 'string' && $scope.openItems.activeHistory.last()) {
          if ($scope.update) {
            updateFileDebounce();
          }
        }
      });

      $scope.$watch('openItems.activeHistory.last().id()', function (newVal, oldVal) {
        if (newVal) {
          if (!$scope.update) {
            var file = $scope.openItems.activeHistory.last();
            if (!(file.state && (typeof file.state.body === 'string'))) {
              //fetch only on first select
              skip = false;
              fetchFile();
            }
          } else {
            skip = true;
            fetchFile();
          }
        }
      });

    }
  };
}
