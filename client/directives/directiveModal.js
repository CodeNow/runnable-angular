require('app')
  .directive('modal', modal);
/**
 * @ngInject
 */
function modal (
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
      actions: '&modalActions',
      template: '@modalTemplate'
    },
    link: function ($scope, element, attrs) {
      var $ = jQuery;
      $scope.in = false;
      $scope.actions = $scope.actions();

      element.on('click', function (event) {
        $scope.in = true;
        event.stopPropagation();
        $rootScope.safeApply();
      });

      $scope.cancel = function () {
        $scope.in = false;
      };

      $scope.$on('app-document-click', function () {
        $scope.modal.removeClass('in');
      });

      var template = $templateCache.get($scope.template);
      var $template = angular.element(template);
      $compile($template)($scope);
      $scope.modal = $($template);
      $('body').append($template);

      $scope.$on('$destroy', function () {
        $scope.modal.remove();
      });
    }
  };
}
