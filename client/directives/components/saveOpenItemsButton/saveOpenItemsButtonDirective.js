'use strict';

require('app')
  .directive('saveOpenItemsButton', saveOpenItemsButton);
/**
 * @ngInject
 */
function saveOpenItemsButton(
) {
  return {
    restrict: 'E',
    templateUrl: 'saveOpenItemsButtonView',
    controller: 'saveOpenItemsButtonController',
    controllerAs: 'SOIBC',
    bindToController: true,
    scope: {
      instance: '=',
      openItems: '=',
      loading: '='
    },
    link: function ($scope) {
      $scope.canSave = function () {
        return !!$scope.SOIBC.openItems.models.find(function (model) {
          return model.state.isDirty;
        });
      };
    }
  };
}
