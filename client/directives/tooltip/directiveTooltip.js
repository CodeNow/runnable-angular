'use strict';

require('app')
  .directive('tooltip', tooltip);
/**
 * directive tooltip
 * @ngInject
 *
 * attrs:
 *   tooltipOptions: location data
 *   tooltipEval: text that will get evaluated, for dynamic text
 *   tooltipDisable: if set, the tooltip will not display when this is true
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
      options.top = (typeof options.top !== 'undefined') ? options.top : 0;
      options.class = (typeof options.class !== 'undefined') ? options.class : false;

      if (typeof options.right === 'undefined' && typeof options.left === 'undefined') {
        options.left = 0;
      }

      $scope.toolTip.getStyle = function () {
        var rect = element[0].getBoundingClientRect();
        var width = $document.find('html')[0].clientWidth;

        var newPosition = {
          'top': (rect.top + options.top + $document.find('body')[0].scrollTop) + 'px'
        };

        if (typeof options.right !== 'undefined') {
          newPosition.right = (width - rect.right + options.right) + 'px';
          newPosition.left = 'auto';
        }
        if (typeof options.left !== 'undefined') {
          newPosition.left = (rect.left + options.left) + 'px';
          newPosition.right = 'auto';
        }

        return newPosition;
      };

      var unobserveText;
      bind(element, 'mouseover', function () {
        if (attrs.tooltipDisabled && $scope.$eval(attrs.tooltipDisabled)) {
          return;
        }
        if (attrs.hasOwnProperty('tooltipObserve')) {
          if (unobserveText) {
            unobserveText();
          }
          unobserveText = attrs.$observe('tooltip', function (newVal) {
            $scope.toolTip.toolTipText = newVal;
          });
          $scope.toolTip.toolTipText = $scope.$eval(attrs.tooltip);
        } else {
          $scope.toolTip.toolTipText = attrs.tooltip;
        }

        if (attrs.tooltipEval) {
          $scope.toolTip.toolTipText = $scope.$eval(attrs.tooltipEval);
        }
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
        if (unobserveText) {
          unobserveText();
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
