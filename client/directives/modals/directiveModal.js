'use strict';

require('app')
  .directive('modal', modal);
/**
 * @ngInject
 */
function modal(
  $templateCache,
  $timeout,
  $compile,
  keypather,
  $rootScope,
  jQuery
) {
  return {
    restrict: 'A',
    scope: {
      data: '=modalData', // Contains modal specific data
      actions: '=modalActions', // Contains modal specific actions
      template: '@modalTemplate',
      currentModel: '=modalCurrentModel', // The object that contains the data to display
      stateModel: '=modalStateModel' // The object that should receive the changes
    },
    link: function ($scope, element, attrs) {
      var $ = jQuery;
      $scope.in = false;
      var tempTemplate = checkTemplate($scope.template);
      var template = $templateCache.get(tempTemplate);
      // Here's a hack to replace the type attribute with the actual template name
      if (tempTemplate !== $scope.template) {
        template = template.replace('%%GENERIC_TEMPLATE_NAME%%', $scope.template);
      }
      var $template = angular.element(template);
      $scope.actions = $scope.actions || {};

      $scope.defaultActions = {
        save: function (state, paths, cb) {
          paths.forEach(function (path) {
            keypather.set($scope.stateModel, path, keypather.get(state, path));
          });
          if (typeof keypather.get($scope, 'actions.save') === 'function') {
            $scope.actions.save();
          }
          cb();
        },
        cancel: function () {
          if (typeof keypather.get($scope, 'actions.cancel') === 'function') {
            $scope.actions.cancel();
          }
          $scope.defaultActions.close();
        },
        close: function () {
          $scope.in = false;
          if ($scope.modal) {
            $scope.modal.remove();
          }
        }
      };

      function createModal (event) {
        if (event) {
          event.stopPropagation();
        }
        $scope.modal = $compile($template)($scope);
        $('body').append($template);
        $scope.in = true;
        if (typeof keypather.get($scope, 'actions.closePopover') === 'function') {
          $scope.actions.closePopover();
        }
        // Trigger a digest cycle
        $timeout(angular.noop);
      }

      element.on('click', createModal);
      $scope.$watch('data.in', function(n) {
        if (n === true) {
          createModal();
        }
      });

      $scope.$on('app-document-click', function() {
        if($scope.in) {
          $scope.defaultActions.close();
          $timeout(angular.noop);
        }
      });

      $scope.$on('$destroy', function () {
        if ($scope.modal) {
          $scope.modal.remove();
        }
        $scope.in = false;
        element[0].onclick = null;
      });
    }
  };
}

var genericModals = ['viewModalDeleteBox', 'viewModalError', 'viewModalRenameBox'];
function checkTemplate(template) {
  return (genericModals.indexOf(template) < 0) ? template : 'viewOpenModalGeneric';
}
