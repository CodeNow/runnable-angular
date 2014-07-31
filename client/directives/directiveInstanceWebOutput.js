require('app')
  .directive('instanceWebOutput', instanceWebOutput);
/**
 * instanceWebOutput
 * @ngInject
 */
function instanceWebOutput() {
  return {
    restrict: 'E',
    // templateUrl: 'viewInstanceWebOutput',
    // replace: true,
    scope: {
      url: '@'
    },
    link: function ($scope, element, attrs) {
      var iframe = document.createElement('iframe');
    }
  };
}
