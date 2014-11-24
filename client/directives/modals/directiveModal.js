require('app')
  .directive('modal', modal);
/**
 * @ngInject
 */
function modal(
  $templateCache,
  $compile,
  keypather,
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

      function setupModal() {
        var tempTemplate = checkTemplate($scope.template);
        var template = $templateCache.get(tempTemplate);
        // Here's a hack to replace the type attribute with the actual template name
        if (tempTemplate !== $scope.template) {
          template = template.replace('%%GENERIC_TEMPLATE_NAME%%', $scope.template);
        }
        var $template = angular.element(template);
        $compile($template)($scope);
        $scope.modal = $($template);
        $('body').append($template);
        $scope.in = true;

        if (keypather.get($scope, 'actions.watchers')) {
          $scope.actions.watchers.forEach(function(watcher) {
            watcher($scope);
          });
        }
        $scope.actions.close = function () {
          $scope.defaultActions.close();
        };
        $scope.defaultActions = {
          save: function (state, paths, cb) {
            paths.forEach(function (path) {
              keypather.set($scope.stateModel, path, keypather.get(state, path));
            });
            if ($scope.actions.save && typeof $scope.actions.save === 'function') {
              $scope.actions.save();
            }
            cb();
          },
          cancel: function () {
            if ($scope.actions.cancel && typeof $scope.actions.cancel === 'function') {
              $scope.actions.cancel();
            }
            $scope.defaultActions.close();
          },
          close: function () {
            $scope.in = false;
            $scope.modal.remove();
          }
        };
      }

      element.on('click', function (event) {
        event.stopPropagation();
        setupModal();
        $rootScope.safeApply();
      });

      $scope.$on('$destroy', function () {
        if ($scope.modal) {
          $scope.modal.remove();
        }
        element.off('click');
      });
    }
  };
}

var genericModals = ['viewModalDeleteBox', 'viewModalError', 'viewModalRenameBox'];
function checkTemplate(template) {
  return (genericModals.indexOf(template) < 0) ? template : 'viewOpenModalGeneric';
}