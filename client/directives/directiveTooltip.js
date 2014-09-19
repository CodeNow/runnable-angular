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
  jQuery,
  keypather
) {

  return {
    restrict: 'A',
    scope: false,
    link: function ($scope, element, attrs) {

      var template = $templateCache.get('viewTooltip');
      var $template = angular.element(template);
      var $tooltipElement;
      var tooltipText;
      var $body = jQuery('body');

      function position () {
        var $e = jQuery(element);
        var eStyle = {
          top: $e.offset().top + 'px',
          left: $e.offset().left + 'px'
        };
        return eStyle;
      }

      function updateTooltip () {
        if(!$tooltipElement) {
          return;
        }
        jQuery($tooltipElement).find('.tooltip-text').html(tooltipText);
      }

      jQuery(element).on('mouseover', function () {
        if ($tooltipElement) {
          return;
        }
        $tooltipElement = $compile($template)($scope);
        $tooltipElement.css(position());
        updateTooltip();
        $body.append($tooltipElement);
      });
      jQuery(element).on('mouseout', function () {
        if(!$tooltipElement) {
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
        $tooltipElement.remove();
      });

    }
  };

}
