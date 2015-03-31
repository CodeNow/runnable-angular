'use strict';

require('app')
  .directive('activePanel', activePanel);
/**
 * activePanel Directive
 * @ngInject
 */
function activePanel(
  $sce,
  colorScheme,
  keypather,
  errs,
  $state,
  promisify,
  $stateParams
) {
  return {
    restrict: 'A',
    templateUrl: 'viewActivePanel',
    scope: {
      openItems: '=',
      instance: '=',
      build: '='
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
      $scope.colorScheme = colorScheme;
      $scope.useAutoUpdate = !!attrs.useAutoUpdate;

      var showBuildFailurePrompt = false;

      $scope.$watch('instance.build.attrs.failed', function (newVal) {
        showBuildFailurePrompt = newVal;
      });

      $scope.showBuildFailurePrompt = function () {
        var activeHistory = $scope.openItems.activeHistory.models;
        var currentPanel = activeHistory[activeHistory.length - 1];
        var isActive = keypather.get(currentPanel, 'state.active');
        var isBuildStream = keypather.get(currentPanel, 'state.type') === 'BuildStream';
        return showBuildFailurePrompt && isActive && isBuildStream;
      };

      $scope.actions = {
        buildWithoutCache: function () {
          showBuildFailurePrompt = false;
          window.alert('Build w/o cache');
        },
        editBuildFiles: function () {
          promisify($scope.instance.build, 'deepCopy')(
          ).then(function (forkedBuild) {
              $state.go('instance.instanceEdit', {
                userName: $stateParams.userName,
                instanceName: $stateParams.instanceName,
                buildId: forkedBuild.id()
              });
            }).catch(errs.handler);
        },
        hideBuildFailurePrompt: function () {
          showBuildFailurePrompt = false;
        }
      };

      $scope.panelStyle = function () {
        if ($scope.showBuildFailurePrompt()) {
          return {
            height: 'calc(100% - 65px)'
          };
        }
        return {
          height: '100%'
        };
      };
    }
  };
}
