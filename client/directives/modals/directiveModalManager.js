'use strict';

require('app')
  .directive('modalManager', modalManager);
/**
 * @ngInject
 */
function modalManager(
  $document,
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
    link: function ($scope) {
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
        var tempTemplate = checkTemplate(options.template);
        var template = $templateCache.get(tempTemplate);

        // Here's a hack to replace the type attribute with the actual template name
        if (tempTemplate !== options.template) {
          template = template.replace('%%GENERIC_TEMPLATE_NAME%%', options.template);
        }

        currentModalScope = $scope.$new(true);
        currentModalScope.data = options.data;
        currentModalScope.actions = options.actions;
        currentModalScope.template = options.template;
        currentModalScope.currentModel = options.currentModel;
        currentModalScope.stateModel = options.stateModel;
        currentModalScope.in = true;

        currentModalScope.defaultActions = {
          save: function (state, paths, cb) {
            paths.forEach(function (path) {
              keypather.set($scope.stateModel, path, keypather.get(state, path));
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
            currentModalScope.defaultActions.close();
          },
          close: function (cb) {
            closeModal(cb);
          }
        };

        var currentModalElement = $compile(template)(currentModalScope);
        $document.find('body').append(currentModalElement);

        currentModalScope.$on('$destroy', function () {
          currentModalElement.remove();
        });

        // Trigger a digest cycle
        $timeout(angular.noop);
      }

      $rootScope.$on('openModal', function (event, options) {
        openModal(options);
      });

      $rootScope.$on('closeModal', function () {
        closeModal();
      });

      $scope.$on('$destroy', function () {
        closeModal();
      });
    }
  };
}

var genericModals = ['viewModalDeleteBox', 'viewModalError', 'viewModalRenameBox'];
function checkTemplate(template) {
  return (genericModals.indexOf(template) < 0) ? template : 'viewOpenModalGeneric';
}