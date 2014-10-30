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

      function keyDownEnter(e) {
        if (e.keyCode === 13) {
          $scope.modal.find('[data-action]').trigger('click');
        }
      }

      element.on('click', function (event) {
        event.stopPropagation();
        $scope.in = true;
        $rootScope.safeApply();
      });

      $scope.cancel = function () {
        if ($scope.actions.cancel && typeof $scope.actions.cancel === 'function') {
          $scope.actions.cancel();
        }
        $scope.in = false;
      };

      $scope.$on('app-document-click', function () {
        if ($scope.in) {
          $scope.cancel();
        }
      });

      var template = $templateCache.get($scope.template);
      var $template = angular.element(template);
      $compile($template)($scope);
      $scope.modal = $($template);
      $('body').append($template);

      $scope.$watch('in', function (n) {
        if (n) {
          jQuery(document).on('keydown', keyDownEnter);
          var autofocus = $scope.modal.find('[autofocus]');
          if (autofocus.length) {
            autofocus[0].select();
          }
        } else {
          jQuery(document).off('keydown', keyDownEnter);
        }
      });

      $scope.$on('$destroy', function () {
        $scope.modal.remove();
        element.off('click');
        jQuery(document).off('keydown', keyDownEnter);
      });
    }
  };
}
