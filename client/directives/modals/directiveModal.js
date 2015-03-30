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
      currentModel: '=modalCurrentModel', // The object that contains the data to display
      stateModel: '=modalStateModel' // The object that should receive the changes
    },
    link: function ($scope, element) {
      function openModal() {
        $scope.$emit('openModal', {
          data: $scope.data,
          actions: $scope.actions,
          template: $scope.template,
          currentModel: $scope.currentModel,
          stateModel: $scope.stateModel
        });
      }
      element.on('click', openModal);
      $scope.$watch('data.in', function (n) {
        if (n === true) {
          openModal();
        }
      });
    }
  };
}
