'use strict';

require('app')
  .directive('serverModalButtons', serverModalButtonsDirective);

function serverModalButtonsDirective(
  $rootScope,
  errs,
  loading
) {
  return {
    restrict: 'A',
    templateUrl: 'serverModalButtonsView',
    scope: {
      thisForm: '=',
      isPrimaryButtonDisabled: '&',
      SMC: '=serverModalController'
    },
    link: function ($scope) {
      $scope.isBuilding = function () {
        return $rootScope.isLoading[$scope.SMC.name + 'isBuilding'] || $rootScope.isLoading[$scope.SMC.name];
      };
      $scope.createServerOrUpdate = function () {
        if ($scope.isPrimaryButtonDisabled()) {
          return;
        }
        loading($scope.SMC.name + 'isBuilding', true);
        loading($scope.SMC.name, true);
        (($scope.SMC.instance) ? $scope.SMC.getUpdatePromise() : $scope.SMC.createServer())
          .then(function () {
            $scope.SMC.changeTab('logs');
            $scope.$emit('resetStateContextVersion', $scope.SMC.state.contextVersion, false);
          })
          .catch(errs.handler)
          .finally(function () {
            loading($scope.SMC.name + 'isBuilding',  false);
            loading($scope.SMC.name,  false);
          });

      };
    }
  };
}
