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
  keypather
) {
  return {
    restrict: 'E',
    templateUrl: 'viewActivePanel',
    replace: true,
    scope: {
      container: '=',
      openItems: '=',
      readOnly: '=',
      update: '=',
      isDarkTheme: '='
    },
    link: function ($scope, element, attrs) {

      var skip = true;

      $scope.$sce = $sce;

      function updateFile (cb) {
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

      if ($scope.update) {
        $scope.$watch('openItems.activeHistory.last().state.body', function (newVal, oldVal) {
          if (typeof newVal === 'string' && $scope.openItems.activeHistory.last()) {
            updateFileDebounce();
          }
        });
      }

      $scope.$watch('openItems.activeHistory.last().attrs._id', function (newVal, oldVal) {
        if (newVal) {
          skip = true;
          fetchFile();
        }
      });
    }
  };
}
