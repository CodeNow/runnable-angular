'use strict';

require('app')
  .directive('modal', modal);
/**
 * @ngInject
 */
function modal() {
  return {
    restrict: 'A',
    scope: {
      data: '=modalData', // Contains modal specific data
      actions: '=modalActions', // Contains modal specific actions
      template: '@modalTemplate',
      currentModel: '=?modalCurrentModel', // The object that contains the data to display
      stateModel: '=?modalStateModel', // The object that should receive the changes
      openFlag: '=?modalOpenFlag'
    },
    link: function ($scope, element, attrs) {
      function openModal() {
        $scope.$emit('open-modal', {
          data: $scope.data,
          actions: $scope.actions,
          template: $scope.template,
          currentModel: $scope.currentModel,
          stateModel: $scope.stateModel
        });
      }

      if (!attrs.modalDisableClick) {
        element.on('click', openModal);
      }
      $scope.$watch('openFlag', function (n) {
        if (n) {
          openModal();
        }
      });
    }
  };
}

var genericModals = ['viewModalDeleteBox', 'viewModalError', 'viewModalRenameBox', 'viewModalEnvironmentVariables', 'viewModalVerifyServer', 'viewModalEditServer', 'viewModalTemplateSelect'];
function checkTemplate(template) {
  return (genericModals.indexOf(template) < 0) ? template : 'viewOpenModalGeneric';
}
