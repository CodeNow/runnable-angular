require('app')
  .directive('activePanel', activePanel);
/**
 * activePanel Directive
 * @ngInject
 */
function activePanel() {
  return {
    restrict: 'E',
    templateUrl: 'viewActivePanel',
    replace: true,
    scope: {
      openFiles: '='
    },
    link: function ($scope, element, attrs) {
      window.ss = $scope;
      $scope.$watch('openFiles.activeFile.attrs.body', function (newval, oldval) {
        if (typeof newval === 'string'){
        }
      });
    }
  };
}
