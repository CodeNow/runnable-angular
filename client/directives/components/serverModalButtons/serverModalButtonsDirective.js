'use strict';

require('app')
  .directive('serverModalButtons', serverModalButtonsDirective);

function serverModalButtonsDirective(
  $rootScope,
  errs,
  loading,
  fetchInstancesByPod,
  promisify
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
      $scope.showCancelButton = function () {
        return !$scope.SMC.instance;
      };

      $scope.showDoneButton = function () {
        if (!$scope.SMC.instance) {
          return false;
        }
        if ($rootScope.featureFlags.demoFlowPhase2 && !$scope.SMC.isDemo) {
          return false;
        }
        return true;
      };

      $scope.showSaveButton = function () {
        if (!$scope.SMC.instance && !$scope.SMC.isTabVisible('buildfiles')) {
          return false;
        }
        if ($rootScope.featureFlags.demoFlowPhase2 && $scope.SMC.isDemo) {
          return false;
        }
        return true;
      };

      $scope.showNextButton = function () {
        if ($scope.SMC.instance) {
          return false;
        }
        if ($scope.SMC.isTabVisible('buildfiles')) {
          return false;
        }
        if ($rootScope.featureFlags.demoFlowPhase2 && $scope.SMC.isDemo) {
          return false;
        }
        return true;
      };

      $scope.showSaveAndBuildButton = function () {
        if ($scope.SMC.instance) {
          return false;
        }
        if (!$rootScope.isLoading[$scope.SMC.name]) {
          return false;
        }
        if (!$scope.SMC.state.advanced && $scope.SMC.state.step >= 4) {
          return false;
        }
        if ($scope.SMC.isDirty() !== 'build') {
          return false;
        }
        return true;
      };

      $scope.showDemoSaveAndBuildButton = function () {
        if (!$rootScope.featureFlags.demoFlowPhase2) {
          return false;
        }
        if (!$scope.SMC.isDemo) {
          return false;
        }
        return true;
      };

      $scope.createServerOrUpdate = function (forceClose) {
        if ($scope.isPrimaryButtonDisabled()) {
          return;
        }
        loading($scope.SMC.name, true);
        if (!$scope.SMC.instance) {
          $scope.SMC.state.step = 4;
        }
        (($scope.SMC.instance) ? $scope.SMC.updateInstanceAndReset() : $scope.SMC.createServer())
          .then(function () {
            if (forceClose) {
              return fetchInstancesByPod()
                .then(function (instances) {
                  return promisify(instances, 'fetch')();
                })
                .then(function () {
                  $scope.SMC.actions.forceClose();
                  $rootScope.$broadcast('launchAhaNavPopover');
                });
            } else {
              $scope.SMC.changeTab('logs');
              $scope.SMC.page = 'build';
              // Move this here for now.  This should be handled in the log tab directive
              $scope.SMC.instance.on('update', function updatePage () {
                $scope.SMC.instance.removeListener('update', updatePage);
                $scope.SMC.page = (([ 'building', 'buildFailed', 'neverStarted' ].indexOf($scope.SMC.instance.status()) === -1) ? 'run' : 'build');
              });
            }
          })
          .catch(errs.handler)
          .finally(function () {
            loading($scope.SMC.name,  false);
          });

      };
    }
  };
}
