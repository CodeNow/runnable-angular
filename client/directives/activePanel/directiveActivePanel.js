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
  $sce
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
      isEditModal: '=?',
      debugContainer: '=?'
    },
    link: function ($scope, element, attrs) {
      $scope.data = {};

      // allow iframe to load url
      $scope.$sce = $sce;
      $scope.useAutoUpdate = !!attrs.useAutoUpdate;
    }
  };
}
