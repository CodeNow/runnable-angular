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

      var template = $templateCache.get('viewToolTip');
      var $template = angular.element(template);
      var $toolTipElement;
      var toolTipText;
      var $body = jQuery('body');

      function position () {
        var $e = jQuery(element);
        var eStyle = {
          top: ($e.offset().top - 45) + 'px',
          left: $e.offset().left + 'px'
        };
        return eStyle;
      }

      function updateToolTip () {
        if(!$toolTipElement) {
          return;
        }
        jQuery($toolTipElement).find('.tooltip-text').html(toolTipText);
      }

      jQuery(element).on('mouseover', function () {
        if ($toolTipElement) {
          return;
        }
        $toolTipElement = $compile($template)($scope);
        $toolTipElement.css(position());
        updateToolTip();
        $body.append($toolTipElement);
      });
      jQuery(element).on('mouseout', function () {
        if(!$toolTipElement) {
          return;
        }
        $toolTipElement.remove();
        $toolTipElement = null;
      });

      attrs.$observe('toolTip', function (interpolatedValue) {
        toolTipText = interpolatedValue;
        updateToolTip();
      });

      $scope.$on('$destroy', function () {
        if ($toolTipElement) {
          $toolTipElement.remove();
        }
      });

    }
  };

}
