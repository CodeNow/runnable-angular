require('app')
  .directive('modalForkBox', modalForkBox);
/**
 * directive modalForkBox
 * @ngInject
 */
function modalForkBox(
) {
  return {
    restrict: 'E',
    templateUrl: 'viewModalForkBox',
    replace: true,
    scope: {},
    link: function ($scope, element, attrs) {
    }
  };
}
