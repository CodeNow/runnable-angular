require('app')
  .directive('popOver', popOver);
/**
 * popOver Directive
 * @ngInject
 */
function popOver(
  $templateCache,
  $timeout,
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
      var options;
      var $body = $('body');

      try {
        options = JSON.parse(attrs.popOverOptions);
      } catch (e) {
        options = {};
      }
      options.left = (typeof options.left !== 'undefined') ? options.left : 0;
      options.top = (typeof options.top !== 'undefined') ? options.top : 0;
      options.class = (typeof options.class !== 'undefined') ? options.class : false;

      function position () {
        var $e = $(element);
        var eStyle = {
          top: ($e.offset().top + options.top) + 'px',
          left: ($e.offset().left + options.left) + 'px'
        };
        return eStyle;
      }

      $scope.$watch('data.show', function (show) {
        if (show) {
          $element = $compile($template)($scope);
          $element.css(position());
          if (options.class) {
            $element.addClass(options.class);
          }
          $body.append($element);
          $element.addClass('in');
        } else {
          if ($element) {
            /**
             * Synchronously removing reference to element
             * in $element so if data.show becomes true again
             * before this element is removed, the UI will create
             * a different popover and the original popover will be
             * removed in the background
             */
            var $t = $element;
            $element.removeClass('in');
            $element = null;
            $timeout(function () {
              if ($t) {
                // will trigger nested directives to remove themselves from DOM
                angular.element($t).scope().$broadcast('$destroy');
                $t.remove();
              }
            }, 150);
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
