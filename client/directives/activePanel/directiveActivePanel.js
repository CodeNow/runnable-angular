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
          showBackgroundButtons[button] = true;
        });
        $scope.showBackgroundButtons = showBackgroundButtons;
      }
      var data = $scope.data = {};

      // allow iframe to load url
      $scope.$sce = $sce;
      $scope.colorScheme = colorScheme;
    }
  };
}
