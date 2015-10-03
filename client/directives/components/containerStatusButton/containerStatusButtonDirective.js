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
    controllerAs: 'SOIBC',
    bindToController: true,
    scope: {
      instance: '=',
      openItems: '=',
      saving: '='
    },
    link: function ($scope) {

      $scope.canSave = function () {
        return !!$scope.SOIBC.openItems.models.find(function (model) {
          return model.state.isDirty;
        });
      };
      $scope.isChanging = function () {
        var status = keypather.get($scope.SOIBC, 'instance.status()');
        return ['starting', 'building', 'stopping'].includes(status);
      };
    }
  };
}
