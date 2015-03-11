'use strict';

require('app')
  .directive('activePanel', activePanel);
/**
 * activePanel Directive
 * @ngInject
 */
function activePanel(
  $sce,
  $state
) {
  return {
    restrict: 'A',
    templateUrl: 'viewActivePanel',
    scope: {
      openItems: '=',
      toggleTheme: '='
    },
    link: function ($scope, element, attrs) {

      var data = $scope.data = {};

      switch($state.$current.name) {
        case 'instance.setup':
          data.readOnly = false;
          $scope.update = true;
          break;
        case 'instance.instance':
          data.readOnly = false;
          $scope.update = false;
          break;
        case 'instance.instanceEdit':
          data.readOnly = false;
          $scope.update = true;
          break;
      }

      // allow iframe to load url
      $scope.$sce = $sce;
    }
  };
}
