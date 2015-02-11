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
  $rootScope,
  $document,
  keypather
) {

  return {
    restrict: 'A',
    link: function ($scope, element, attrs) {

      var template = $templateCache.get('viewTooltip');
      var $template = angular.element(template);
      var $tooltipElement;
      var tooltipText;

      var options;
      try {
        options = JSON.parse(attrs.tooltipOptions);
      } catch (e) {
        options = {};
      }
      options.left = (typeof options.left !== 'undefined') ? options.left : 0;
      options.top = (typeof options.top !== 'undefined') ? options.top : 0;
      options.class = (typeof options.class !== 'undefined') ? options.class : false;

      function position() {
        var offset = element[0].getBoundingClientRect();
        var eStyle = {
          top: (offset.top + options.top) + 'px',
          left: (offset.left + options.left) + 'px'
        };
        return eStyle;
      }

      function updateTooltip() {
        if (!$tooltipElement) {
          return;
        }
        // HACKY HACKY BAD
        $tooltipElement[0].querySelector('.tooltip-text').innerText = tooltipText;
      }

      element.on('mouseover', function () {
        if ($tooltipElement) {
          return;
        }
        $tooltipElement = $compile($template)($scope);
        $tooltipElement.css(position());
        if (options.class) {
          $tooltipElement.addClass(options.class);
        }
        updateTooltip();
        $document.find('body').append($tooltipElement);
      });
      element.on('mouseout', function () {
        if (!$tooltipElement) {
          return;
        }
        $tooltipElement.remove();
        $tooltipElement = null;
      });

      attrs.$observe('tooltip', function (interpolatedValue) {
        tooltipText = interpolatedValue;
        updateTooltip();
      });

      $scope.$on('$destroy', function () {
        if ($tooltipElement) {
          $tooltipElement.remove();
        }
      });

    }
  };

}
