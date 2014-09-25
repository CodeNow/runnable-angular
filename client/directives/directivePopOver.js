require('app')
  .directive('popOver', popOver);
/**
 * popOver Directive
 * @ngInject
 */
function popOver(
  $templateCache,
  $compile,
  jQuery
) {
  return {
    restrict: 'E',
    //templateUrl: function ($element, attrs) {
    //  return attrs.template;
    //},
    //replace: true,
    scope: {
      data: '=',
      actions: '&'
    },
    link: function ($scope, element, attrs) {

      var $ = jQuery;
      var templateJADE = $templateCache.get(attrs.template);
      var $template = angular.element(templateJADE);
      var $element;
      var $body = $('body');

      function position () {
        var $e = $(element);
        var eStyle = {
          top: ($e.offset().top) + 'px',
          left: ($e.offset().left) + 'px'
        };
        return eStyle;
      }

      $scope.$watch('data.show', function (show) {
        if (show) {
          $element = $compile($template)($scope);
          $element.css(position());
          $body.append($element);
        } else {
          if ($element) {
            $element.remove();
            $element = null;
          }
        }
      });

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
