require('app')
  .directive('toolTip', toolTip);
/**
 * directive toolTip
 * @ngInject
 */
function toolTip(
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

      var text = attrs.toolTip;
      if(!text) {
        return;
      }

      var template = $templateCache.get('viewToolTip');
      var $template = angular.element(template);
      var $element = $compile($template)($scope);
      $element.find('.tooltip-text').append(text);
      var $body = jQuery('body');
      $body.$append($element);

      $scope.$on('$destroy', function () {
        $element.remove();
      });

    }
  };

}
