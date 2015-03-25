'use strict';

require('app')
  .directive('activePanel', activePanel);
/**
 * activePanel Directive
 * @ngInject
 */
function activePanel(
  $sce,
  colorScheme
) {
  return {
    restrict: 'A',
    templateUrl: 'viewActivePanel',
    scope: {
      openItems: '=',
      instance: '=',
      build: '=',
      validation: '=',
      stateModel: '='
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
      var data = $scope.data = {};

      // allow iframe to load url
      $scope.$sce = $sce;
      $scope.colorScheme = colorScheme;
      $scope.useAutoUpdate = !!attrs.useAutoUpdate;
    }
  };
}
