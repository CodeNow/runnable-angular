'use strict';

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
  debounce,
  editorCache,
  keypather,
  modelist,
  $rootScope,
  $sce,
  $state
) {
  return {
    restrict: 'A',
    templateUrl: 'viewActivePanel',
    scope: {
      openItems: '=',
      currentModel: '=', // CurrentModel houses the original model without changes
      stateModel: '=', // The StateModel is where changes will be applied
      item: '='
    },
    link: function ($scope, element, attrs) {

      var data = $scope.data = {};
      var actions = $scope.actions = {};

      switch($state.$current.name) {
        case 'instance.setup':
          data.readOnly = false;
          $scope.update = true;
          break;
        case 'instance.instance':
          data.readOnly = false;
          $scope.update = false;
          break;
        case 'instance.instanceEdit':
          data.readOnly = false;
          $scope.update = true;
          break;
      }

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
        // Allows other components to interact with this editor
        editorCache[name] = _editor;
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
        activeFile.state.isDirty = true;
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
          delete activeFile.state.isDirty;
        });
      }
      var updateFileDebounce = debounce(updateFile, 333);


      $scope.$watch('openItems.activeHistory.last().state.body', function (newVal, oldVal) {
        if (typeof newVal === 'string' &&
          $scope.openItems.activeHistory.last() &&
          $scope.openItems.activeHistory.last().id() === $scope.thisFileId) {
          if ($scope.update) {
            updateFileDebounce();
          }
        }
      });

      function fetchFile() {
        var openItems = $scope.openItems;
        var last = openItems.activeHistory.last();
        $scope.thisFileId = last.id();
        if (openItems.isFile(last)) {
          last.fetch(function () {
            last.state.reset();
          });
        }
      }

      var openFileWatch = $scope.$watch('openItems.activeHistory.last().id()', function (newVal, oldVal) {
        if (newVal) {
          openFileWatch();
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
