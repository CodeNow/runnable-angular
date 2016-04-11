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
      $scope.showSaveAndBuild = function () {
        return (
          (!$scope.SMC.instance && $scope.SMC.isMirroringDockerfile) ||
          (!$scope.SMC.instance && $scope.SMC.state.step < 4) ||
          ($scope.SMC.isDirty() === 'build' && !$rootScope.isLoading[$scope.SMC.name])
        );
      };
      $scope.createServerOrUpdate = function () {
        if ($scope.isPrimaryButtonDisabled()) {
          return;
        }
        loading($scope.SMC.name, true);
        if (!$scope.SMC.instance) {
          $scope.SMC.state.step = 4;
        }
        (($scope.SMC.instance) ? $scope.SMC.updateInstanceAndReset() : $scope.SMC.createServer())
          .then(function () {
            $scope.SMC.changeTab('logs');
            $scope.SMC.page = 'build';
            // Move this here for now.  This should be handled in the log tab directive
            $scope.SMC.instance.on('update', function updatePage() {
              $scope.SMC.instance.removeListener('update', updatePage);
              $scope.SMC.page = ((['building', 'buildFailed', 'neverStarted'].indexOf($scope.SMC.instance.status()) === -1) ? 'run' : 'build');
            });
          })
          .catch(errs.handler)
          .finally(function () {
            loading($scope.SMC.name,  false);
          });

      };
    }
  };
}
