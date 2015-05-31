'use strict';

require('app')
  .directive('activePanel', activePanel);
/**
 * activePanel Directive
 * @ngInject
 *
 * Attributes:
 *  backgroundButtons: Comma separated list of the tabs that can be allowed and added
 *
 */
function activePanel(
  $sce,
  $q,
  keypather,
  updateInstanceWithNewBuild,
  errs,
  instanceStatus,
  promisify,
  loading
) {
  return {
    restrict: 'A',
    templateUrl: 'viewActivePanel',
    scope: {
      openItems: '=',
      instance: '=',
      build: '=',
      validation: '=',
      stateModel: '=',
      isEditModal: '=?'
    },
    link: function ($scope, element, attrs) {

      /**
       * showBackgroundButtons
       * @type {{ web, build, server, term }}
       */
      if (attrs.backgroundButtons) {
        var showBackgroundButtons = {};
        attrs.backgroundButtons.split(',').forEach(function (button) {
          showBackgroundButtons[button.trim()] = true;
        });
        $scope.showBackgroundButtons = showBackgroundButtons;
      }
      $scope.data = {};

      // allow iframe to load url
      $scope.$sce = $sce;
      $scope.useAutoUpdate = !!attrs.useAutoUpdate;

      var shouldShowBuildFailurePrompt = false;
      $scope.shouldShowUpdateConfigsPrompt = false;

      $scope.$watch('instance.build.attrs.failed', function (newVal) {
        shouldShowBuildFailurePrompt = newVal;
      });

      if (!$scope.isEditModal) {
        $scope.$watch('instance.configStatusValid', function (configStatusValid) {
          if ($scope.instance) {
            if (configStatusValid === false) {
              // This will cause the valid flag to flip, recalling this watcher
              return promisify($scope.instance, 'fetchParentConfigStatus')()
                .catch(errs.handler);
            } else {
              $scope.shouldShowUpdateConfigsPrompt = !$scope.instance.cachedConfigStatus;
            }
          }
        });
      }

      $scope.highlightRebuildWithoutCache = false;
      $scope.$watch('instance.contextVersion.attrs.build.triggeredAction.manual', function (newVal) {
        $scope.highlightRebuildWithoutCache = newVal;
      });

      $scope.showBuildFailurePrompt = function () {
        var activeHistory = keypather.get($scope, 'openItems.activeHistory.models');
        if (!activeHistory) {
          return false;
        }
        var isEditModal = $scope.isEditModal;
        var currentPanel = activeHistory[activeHistory.length - 1];
        var isActive = keypather.get(currentPanel, 'state.active');
        var isBuildStream = keypather.get(currentPanel, 'state.type') === 'BuildStream';
        return !isEditModal && shouldShowBuildFailurePrompt && isActive && isBuildStream;
      };

      $scope.actions = {
        buildWithoutCache: function () {
          shouldShowBuildFailurePrompt = false;
          loading('main', true);
          promisify($scope.instance.build, 'deepCopy')()
            .then(function (build) {
              return updateInstanceWithNewBuild(
                $scope.instance,
                build,
                true
              );
            })
            .catch(errs.handler)
            .finally(function () {
              loading('main', false);
            });
        },
        updateConfigToMatchMaster: function () {
          $scope.shouldShowUpdateConfigsPrompt = false;
          $scope.updatingToMatchMaster = true;
          loading('main', true);
          var instanceUpdates = {};
          promisify($scope.instance, 'fetchMasterPod', true)()
            .then(function (masterPodInstances) {
              var masterPodInstance = masterPodInstances.models[0];
              instanceUpdates.masterPodInstance = masterPodInstance;
              instanceUpdates.opts = {
                env: masterPodInstance.attrs.env
              };
              return promisify(instanceUpdates.masterPodInstance.build, 'deepCopy')();
            })
            .then(function (build) {
              instanceUpdates.build = build;
              instanceUpdates.contextVersion = build.contextVersions.models[0];
              return promisify(instanceUpdates.contextVersion, 'fetch')();
            })
            .then(function () {
              var currentAcvAttrs = $scope.instance.contextVersion.getMainAppCodeVersion().attrs;
              // Delete the transformRules, since we don't want to update what Master had
              delete currentAcvAttrs.transformRules;
              return promisify(
                instanceUpdates.contextVersion.getMainAppCodeVersion(),
                'update'
              )($scope.instance.contextVersion.getMainAppCodeVersion().attrs);
            })
            .then(function () {
              return updateInstanceWithNewBuild(
                $scope.instance,
                instanceUpdates.build,
                true
              );
            })
            .catch(errs.handler)
            .finally(function () {
              loading('main', false);
              $scope.updatingToMatchMaster = false;
            });
        },
        hideBuildFailurePrompt: function () {
          shouldShowBuildFailurePrompt = false;
        }
      };
    }
  };
}
