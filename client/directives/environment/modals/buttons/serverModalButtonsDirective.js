'use strict';

require('app')
  .directive('serverModalButtons', serverModalButtonsDirective);

function serverModalButtonsDirective(
  $rootScope,
  loading
) {
  return {
    restrict: 'A',
    templateUrl: function () {
      if ($rootScope.featureFlags.rebuildFlow) {
        return 'serverModalButtonsView';
      }
      return 'serverModalButtonsOldView';
    },
    scope: {
      thisForm: '=',
      isPrimaryButtonDisabled: '&',
      SMC: '=serverModalController'
    },
    link: function ($scope, elem, attrs) {
      $scope.isBuilding = function () {
        return loading[$scope.SMC.name + 'isBuilding'];
      };
      $scope.createServerOrUpdate = function () {
        if ($scope.isPrimaryButtonDisabled()) {
          return;
        }
        if ($scope.SMC.instance) {
          $scope.SMC.changeTab('logs');
          $scope.SMC.getUpdatePromise();
        } else if ($scope.SMC.goToNextStep) {
          $scope.SMC.goToNextStep();
        }
      };
    }
  };
}
