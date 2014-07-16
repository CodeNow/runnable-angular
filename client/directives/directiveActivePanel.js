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
    }
  };
}
