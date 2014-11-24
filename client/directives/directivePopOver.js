require('app')
  .directive('popOver', popOver);
/**
 * popOver Directive
 * @ngInject
 */
function popOver() {
  return {
    restrict: 'E',
    templateUrl: function ($element, attrs) {
      return attrs.template;
    },
    replace: true,
    scope: {
      data: '=',
      actions: '='
    },
    link: function ($scope, element, attrs) {
      element.on('click', function (event) {
        event.stopPropagation();
      });
      element.on('$destroy', function () {
        element.off('click');
      });
    }
  };
}
