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
  $rootScope,
  $q
) {
  return {
    restrict: 'A',
    scope: {
      modalOpen: '='
    },
    link: function ($scope, element) {
      var currentModalScope;

      function closeModal(cb) {
        if (currentModalScope) {
          var closePromise = $q.when(true);
          if (currentModalScope.closeHandler) {
            closePromise = currentModalScope.closeHandler();
          }
          closePromise
            .then(function () {
              $scope.modalOpen = false;
              currentModalScope.openFlag = false;
              $timeout(function () {
                if (currentModalScope) {
                  currentModalScope.$destroy();
                  currentModalScope = null;
                }
                if (cb) {
                  cb();
                }
              });
          });
        } else if (cb) {
          cb();
        }
      }

      function openModal(options) {
        closeModal(function () {
          $rootScope.$broadcast('close-popovers');
          var tempTemplate = checkTemplate(options.template);
          var template = $templateCache.get(tempTemplate);

          // Here's a hack to replace the type attribute with the actual template name
          if (tempTemplate !== options.template) {
            template = template.replace('%%GENERIC_TEMPLATE_NAME%%', options.template);
          }

          $scope.currentModalScope = currentModalScope = $scope.$new(true);
          currentModalScope[options.controllerAs] = options.controller;
          currentModalScope.actions = options.actions;
          currentModalScope.template = options.template;
          currentModalScope.openFlag = options.openFlag;
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
          currentModalElement.foo = Math.random();
          $scope.modalOpen = true;

          currentModalScope.$on('$destroy', function () {
            if (currentModalElement) {
              currentModalElement.remove();
            }
          });
        });
      }

      var unOpen = $rootScope.$on('open-modal', function (event, options) {
        openModal(options);
      });

      var unClose = $rootScope.$on('close-modal', function () {
        closeModal();
      });

      var unListenForSetCloseHandler = $rootScope.$on('set-close-modal-handler', function (evt, handler) {
        if (currentModalScope) {
          currentModalScope.closeHandler = handler;
        }
      });
      var unListenForResetCloseHandler = $rootScope.$on('reset-close-modal-handler', function () {
        if (currentModalScope) {
          currentModalScope.closeHandler = null;
        }
      });

      $scope.$on('$destroy', function () {
        unOpen();
        unClose();
        unListenForSetCloseHandler();
        unListenForResetCloseHandler();
        closeModal();
      });
    }
  };
}

var genericModals = ['viewModalDeleteBox', 'viewModalEnvironmentVariables', 'viewModalRepositorySelect', 'viewModalVerifyServer', 'viewModalEditServer', 'viewModalTemplateSelect', 'confirmBuildFilesModalView', 'viewModalRename', 'viewModalChooseOrganization', 'viewModalIsolation', 'viewModalSetup', 'viewModalDeleteSandbox'];
function checkTemplate(template) {
  return (genericModals.indexOf(template) === -1) ? template : 'viewOpenModalGeneric';
}
