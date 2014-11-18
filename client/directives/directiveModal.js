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
      template: '@modalTemplate',
      currentModel: '=modalCurrentModel',
      stateModel: '=modalStateModel'
    },
    link: function ($scope, element, attrs) {
      var $ = jQuery;
      $scope.in = false;

      function keyDownEnter(e) {
        if (e.keyCode === 13) {
          $scope.modal.find('[data-action]').trigger('click');
        }
      }

      function setupModal() {
        var template = $templateCache.get($scope.template);
        var $template = angular.element(template);
        $compile($template)($scope);
        $scope.modal = $($template);
        $('body').append($template);
        $scope.in = true;

        var unregClick = $scope.$on('app-document-click', function () {
          if ($scope.in) {
            $scope.cancel();
          }
        });
        $scope.actions.close = function () {
          unregClick();
          $scope.modal.remove();
          $scope.in = false;
        };
        $scope.cancel = function () {
          if ($scope.actions.cancel && typeof $scope.actions.cancel === 'function') {
            $scope.actions.cancel();
          }
          $scope.actions.close();
        };
      }

      element.on('click', function (event) {
        event.stopPropagation();
        setupModal();
        $rootScope.safeApply();
      });

      var unregIn = $scope.$watch('in', function (n) {
        if (n) {
          jQuery(document).on('keydown', keyDownEnter);
          var autofocus = $scope.modal.find('[autofocus]');
          if (autofocus.length) {
            $rootScope.safeApply(function() {
              autofocus[0].select();
            });
          }
        } else {
          jQuery(document).off('keydown', keyDownEnter);
        }
      });

      $scope.$on('$destroy', function () {
        if ($scope.modal) {
          $scope.modal.remove();
        }
        element.off('click');
        unregIn();
        jQuery(document).off('keydown', keyDownEnter);
      });
    }
  };
}
