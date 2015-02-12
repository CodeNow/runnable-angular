'use strict';

require('app')
  .directive('tooltip', tooltip);
/**
 * directive tooltip
 * @ngInject
 */
function tooltip(
  $templateCache,
  $compile,
  $document,
  $timeout
) {

  return {
    restrict: 'A',
    link: function ($scope, element, attrs) {

      var template = $templateCache.get('viewTooltip');
      var $template = angular.element(template);
      var $tooltipElement;
      $scope.toolTip = {};

      var options;
      try {
        options = JSON.parse(attrs.tooltipOptions);
      } catch (e) {
        options = {};
      }
      options.left = (typeof options.left !== 'undefined') ? options.left : 0;
      options.top = (typeof options.top !== 'undefined') ? options.top : 0;
      options.class = (typeof options.class !== 'undefined') ? options.class : false;

      $scope.toolTip.getStyle = function () {
        var rect = element[0].getBoundingClientRect();
        return {
          'top': (rect.top + options.top) + 'px',
          'left': (rect.left + options.left) + 'px'
        };
      };

      bind(element, 'mouseover', function () {
        $scope.toolTip.toolTipText = attrs.tooltip;
        $tooltipElement = $compile($template)($scope);
        $tooltipElement.addClass(options.class);
        $document.find('body').append($tooltipElement);
        $timeout(angular.noop);
      });
      bind(element, 'mouseout', function () {
        if (!$tooltipElement) {
          return;
        }
        $tooltipElement.remove();
        $tooltipElement = null;
      });

      $scope.$on('$destroy', function () {
        if ($tooltipElement) {
          $tooltipElement.remove();
        }
      });

      function bind(element, event, fn) {
        element.on(event, fn);
        $scope.$on('$destroy', function () {
          element.off(event, fn);
        });
      }
    }
  };

}
