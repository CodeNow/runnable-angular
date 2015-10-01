'use strict';

require('app')
  .directive('saveOpenItemsButton', saveOpenItemsButton);
/**
 * @ngInject
 */
function saveOpenItemsButton(
  keypather
) {
  return {
    restrict: 'A',
    templateUrl: 'saveOpenItemsButtonView',
    controller: 'saveOpenItemsButtonController',
    controllerAs: 'ROSC',
    bindToController: true,
    scope: {
      instance: '=',
      openItems: '=',
      saving: '='
    },
    link: function ($scope) {
      $scope.canSave = function () {
        return !!$scope.openItems.models.find(function (model) {
          return model.state.isDirty;
        });
      };
      $scope.isChanging = function () {
        var status = keypather.get($scope, 'instance.status()');
        return ['starting', 'building', 'stopping'].includes(status);
      };
    }
  };
}
