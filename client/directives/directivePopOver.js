require('app')
  .directive('popOver', popOver);
/**
 * popOver Directive
 * @ngInject
 */
function popOver(
  jQuery
) {
  return {
    restrict: 'E',
    templateUrl: function ($element, attrs) {
      console.log(attrs);
      return attrs.template;
    },
    replace: true,
    scope: {
      data: '=',
      actions: '&'
    },
    link: function ($scope, element, attrs) {
      var $ = jQuery;
      var clickHandler = $.proxy(function (event) {
        event.stopPropagation();
      }, $scope);
      element.on('click', clickHandler);
      element.on('$destroy', function () {
        element.off('click');
      });
      $scope.actions = $scope.actions();
    }
  };
}
