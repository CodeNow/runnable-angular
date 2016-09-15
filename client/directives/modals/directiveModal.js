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
      controller: '=?modalController', // Contains modal specific data
      controllerAs: '@?modalControllerAs', // the property name used to access controller
      actions: '=?modalActions', // Contains modal specific actions
      template: '@modalTemplate',
      currentModel: '=?modalCurrentModel', // The object that contains the data to display
      stateModel: '=?modalStateModel', // The object that should receive the changes
      openFlag: '=?modalOpenFlag'
    },
    link: function ($scope, element, attrs) {
      function openModal() {
        $scope.$emit('open-modal', {
          actions: $scope.actions,
          controller: $scope.controller,
          controllerAs: $scope.controllerAs,
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
