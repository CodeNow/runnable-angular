'use strict';

require('app')
  .directive('saveOpenItemsButton', saveOpenItemsButton);
/**
 * @ngInject
 */
function saveOpenItemsButton(
) {
  return {
    restrict: 'A',
    replace: true,
    templateUrl: 'saveOpenItemsButtonView',
    controller: 'SaveOpenItemsButtonController',
    controllerAs: 'SOIBC',
    bindToController: true,
    scope: {
      instance: '=',
      openItems: '='
    },
    link: function ($scope) {
      $scope.save = function (andRestart) {
        $scope.loading = true;
        $scope.SOIBC.saveChanges(andRestart)
          .finally(function () {
            $scope.loading = false;
          });
      };
    }
  };
}
