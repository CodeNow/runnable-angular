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
      function getDisplayFlagHash () {
        // Possible Buttons
        //   cancel
        //   done
        //   save
        //   next
        //   demoSave
        //   willRebuildOnSave
        //   disableSave

        if ($rootScope.featureFlags.demoFlowPhase2 && $scope.SMC.isDemo) {
          // Demo Mode
          return {
            demoSave: true,
            cancel: true
          };
        }

        var disableSaveButton = ($scope.SMC.needsToBeDirtySaved() && !$scope.SMC.isDirty()) || $scope.isPrimaryButtonDisabled();
        if (!$scope.SMC.isSettingUpNewInstance) {
          // We have an instance we are editing
          var willRebuild = $scope.SMC.isDirty() === 'build';
          return {
            cancel: true,
            willRebuildOnSave: willRebuild,
            save: true,
            done: true,
            disableSave: disableSaveButton
          };
        }

        // We haven't gotten through our steps yet!
        if (!$scope.SMC.isTabVisible('buildfiles')) {
          return {
            cancel: true,
            next: true
          };
        }

        // We are at the final stages of setup
        return {
          save: true,
          willRebuildOnSave: true,
          cancel: true,
          disableSave: disableSaveButton
        };
      }

      var _displayFlagCache;
      $scope.$watch(function () {
        _displayFlagCache = null;
      });
      $scope.getDisplayFlag = function (buttonName) {
        if (!_displayFlagCache) {
          _displayFlagCache = getDisplayFlagHash();
        }
        return _displayFlagCache[buttonName];
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
