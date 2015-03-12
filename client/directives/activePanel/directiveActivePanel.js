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
      openItems: '='
    },
    link: function ($scope, element, attrs) {

      var data = $scope.data = {};

      // allow iframe to load url
      $scope.$sce = $sce;
      $scope.colorScheme = colorScheme;
    }
  };
}
