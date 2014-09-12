require('app')
  .directive('modal', modal);
/**
 * @ngInject
 */
function modal(
  $templateCache,
  $compile,
  $timeout,
  $rootScope,
  jQuery
) {
  return {
    restrict: 'A',
    scope: {
      data: '=modalData',
      actions: '=modalActions',
      template: '@modalTemplate'
    },
    link: function ($scope, element, attrs) {
      var $ = jQuery;
      $scope.in = false;

      element.on('click', function (event) {
        event.stopPropagation();
        $scope.in = true;
        $rootScope.safeApply();
      });

      $scope.cancel = function () {
        $scope.in = false;
      };

      $scope.$on('app-document-click', function () {
        $scope.in = false;
      });

      var template = $templateCache.get($scope.template);
      var $template = angular.element(template);
      $compile($template)($scope);
      $scope.modal = $($template);
      $('body').append($template);

      if ($scope.modal.find('[autofocus]').length) {
        $scope.$watch('in', function (n) {
          if (n) {
            $scope.modal.find('[autofocus]')[0].focus();
          }
        });
      }

      $scope.$on('$destroy', function () {
        $scope.modal.remove();
      });
    }
  };
}
