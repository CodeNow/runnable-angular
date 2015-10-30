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
 *   tooltipActiveAttr: (true/false) if set, the tooltip will display when this value is true
 */
function tooltip(
  $templateCache,
  $compile,
  $document,
  $timeout,
  $window
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
        if (options.centered) {
          newPosition.right = null;
          newPosition.left = (-rect.offsetWidth / 2 + newPosition.left + (newPosition.right - newPosition.left) / 2) + 'px';
        }

        if (options.verticallyCentered) {
          newPosition.bottom = null;
          newPosition.top = (-rect.offsetHeight / 2 + newPosition.top + (newPosition.bottom - newPosition.top) / 2) + 'px';
        }


        return newPosition;
      };
      var unwatchValueChange = null;
      function createTooltipAndAttach() {
        if (attrs.tooltipDisabled && $scope.$eval(attrs.tooltipDisabled)) {
          return;
        }
        $scope.toolTip.toolTipText = attrs.tooltip;
        if (attrs.tooltipEval) {
          $scope.toolTip.toolTipText = $scope.$eval(attrs.tooltipEval);
        }
        if (attrs.hasOwnProperty('tooltipWithButton')) {
          bind($document, 'mousemove', function (e) {
            console.log('zHEY', e.pageX, e.pageY);
          });
        }
        $tooltipElement = $compile($template)($scope);
        $tooltipElement.addClass(options.class);
        $document.find('body').append($tooltipElement);
        $timeout(angular.noop);
      }

      if (attrs.hasOwnProperty('tooltipActiveAttr')) {
        unwatchValueChange = attrs.$observe('tooltipActiveAttr', function (newValue, oldValue) {
          if (newValue === 'true' && newValue !== oldValue) {
            createTooltipAndAttach();
          }
        });
      } else {
        bind(element, 'mouseover', createTooltipAndAttach);
      }
      function removeToolTip() {
        if (!$tooltipElement) {
          return;
        }
        $tooltipElement.remove();
        $tooltipElement = null;
      }
      if (!attrs.hasOwnProperty('tooltipWithButton')) {
        bind(element, 'mouseout', removeToolTip);
      }

      $scope.$on('$destroy', function () {
        if ($tooltipElement) {
          $tooltipElement.remove();
        }
        if (unwatchValueChange) {
          unwatchValueChange();
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
