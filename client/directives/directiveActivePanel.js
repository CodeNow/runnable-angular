require('app')
  .directive('activePanel', activePanel);
/**
 * activePanel Directive
 * @ngInject
 */
function activePanel(
  $timeout,
  $rootScope,
  $sce,
  async,
  debounce,
  keypather,
  modelist
) {
  return {
    restrict: 'E',
    templateUrl: 'viewActivePanel',
    replace: true,
    scope: {
      instance: '=',
      build: '=',
      container: '=',
      openItems: '=',
      readOnly: '=',
      update: '=', // true: save file when content changes
      isDarkTheme: '='
    },
    link: function ($scope, element, attrs) {

      var data = $scope.data = {};
      var actions = $scope.actions = {};
      data.readOnly = $scope.readOnly;

      actions.onFocus = function () {
        $rootScope.$broadcast('app-document-click');
      };

      actions.setAceMode = function (_editor) {
        var filename = $scope.openItems.activeHistory.last().attrs.name;
        var mode = modelist.getModeForPath(filename).mode;
        _editor.getSession().setMode(mode);
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
          } else {
            // mark as dirty?
          }
        }
      });

      // model.id() for files can lead to duplicates w/ setup page
      // ex: "/Dockerfile"
      $scope.$watch('openItems.activeHistory.last().attrs._id', function (newVal, oldVal) {
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
