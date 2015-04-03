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
  colorScheme,
  keypather,
  helperInstanceActionsModal,
  updateInstanceWithNewBuild,
  errs,
  $rootScope,
  promisify
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

      $scope.popoverGearMenu = {
        data: {},
        actions: {}
      };
      // mutate scope, shared-multiple-states properties & logic for actions-modal
      helperInstanceActionsModal($scope);

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
      $scope.colorScheme = colorScheme;
      $scope.useAutoUpdate = !!attrs.useAutoUpdate;

      var shouldShowBuildFailurePrompt = false;

      $scope.$watch('instance.build.attrs.failed', function (newVal) {
        shouldShowBuildFailurePrompt = newVal;
      });

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
          keypather.set($rootScope, 'dataApp.data.loading', true);
          promisify($scope.instance.build, 'deepCopy')()
            .then(function (build) {
              updateInstanceWithNewBuild(
                $scope.instance,
                build,
                true,
                {},
                {}
              )
                .catch(errs.handler)
                .finally(function () {
                  keypather.set($rootScope, 'dataApp.data.loading', false);
                });
            });
        },
        hideBuildFailurePrompt: function () {
          shouldShowBuildFailurePrompt = false;
        }
      };
    }
  };
}
