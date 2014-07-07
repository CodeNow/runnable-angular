require('app')
  .directive('fileTree', fileTreeFactory);
/**
 * fileTree Directive
 * @constructor
 * @export
 * @ngInject
 */
function fileTreeFactory (
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'fileTree',
    replace: true,
    scope: {
      'version': '=',
      'container': '='
    },
    link: function (scope, element, attrs) {

    }
  };
}
