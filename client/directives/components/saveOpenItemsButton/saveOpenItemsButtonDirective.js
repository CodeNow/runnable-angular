'use strict';

require('app')
  .directive('saveOpenItemsButton', saveOpenItemsButton);
/**
 * @ngInject
 *
 * Attrs:
 *  hideRestart: Hides the dropdown arrow to allow the user to save and restart
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
    link: function ($scope, elem, attrs) {
      $scope.hideRestart = attrs.hasOwnProperty('hideRestart');
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
