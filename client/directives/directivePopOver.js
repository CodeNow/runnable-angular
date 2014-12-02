require('app')
  .directive('popOver', popOver);
/**
 * popOver Directive
 * @ngInject
 */
function popOver(
  $rootScope
) {
  return {
    restrict: 'E',
    templateUrl: function ($element, attrs) {
      return attrs.template;
    },
    replace: true,
    scope: {
      data: '=',
      actions: '='
    },
    link: function ($scope, element, attrs) {
      $scope.$watch(function () {
        return element.hasClass('in');
      }, function(n) {
        if (n) {
          var autofocus = element[0].querySelector('[autofocus]');
          if (autofocus) {
            $rootScope.safeApply(function() {
              autofocus.select();
            });
          }
        }
      });
      element.on('click', function (event) {
        event.stopPropagation();
      });
      element.on('$destroy', function () {
        element.off('click');
      });
    }
  };
}
