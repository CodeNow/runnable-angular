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
    scope: {
      'build': '='
    },
    link: function (scope, element, attrs) {

    }
  };
}
