'use strict';

require('app')
  .directive('modalManager', modalManager);
/**
 * @ngInject
 */
function modalManager(
  $templateCache,
  $timeout,
  $compile,
  keypather,
  $rootScope
) {
  return {
    restrict: 'A',
    scope: {

    },
    link: function ($scope, element) {
      var currentModalScope;

      function closeModal(cb) {
        if (currentModalScope) {
          currentModalScope.$destroy();
          if(cb){
            cb();
          }
          currentModalScope = null;
        }
      }

      function openModal(options){
        closeModal();
        $rootScope.$broadcast('close-popovers');
        var tempTemplate = checkTemplate(options.template);
        var template = $templateCache.get(tempTemplate);

        // Here's a hack to replace the type attribute with the actual template name
        if (tempTemplate !== options.template) {
          template = template.replace('%%GENERIC_TEMPLATE_NAME%%', options.template);
        }

        $scope.currentModalScope = currentModalScope = $scope.$new(true);
        currentModalScope.data = options.data;
        currentModalScope.actions = options.actions;
        currentModalScope.template = options.template;
        currentModalScope.currentModel = options.currentModel;
        currentModalScope.stateModel = options.stateModel;

        currentModalScope.defaultActions = {
          save: function (state, paths, cb) {
            paths.forEach(function (path) {
              keypather.set(currentModalScope.stateModel, path, keypather.get(state, path));
            });
            if (typeof keypather.get(currentModalScope, 'actions.save') === 'function') {
              currentModalScope.actions.save();
            }
            cb();
          },
          cancel: function () {
            if (typeof keypather.get(currentModalScope, 'actions.cancel') === 'function') {
              currentModalScope.actions.cancel();
            }
            closeModal();
          },
          close: function (cb) {
            closeModal(cb);
          }
        };

        var currentModalElement = $compile(template)(currentModalScope);
        element.append(currentModalElement);

        currentModalScope.$on('$destroy', function () {
          if (currentModalElement) {
            currentModalElement.remove();
          }
        });
      }

      $rootScope.$on('open-modal', function (event, options) {
        openModal(options);
      });

      $rootScope.$on('close-modal', function () {
        closeModal();
      });

      $scope.$on('$destroy', function () {
        closeModal();
      });
    }
  };
}

var genericModals = ['viewModalDeleteBox', 'viewModalError', 'viewModalRenameBox', 'viewModalEnvironmentVariables', 'viewModalRepositorySelect'];
function checkTemplate(template) {
  return (genericModals.indexOf(template) === -1) ? template : 'viewOpenModalGeneric';
}