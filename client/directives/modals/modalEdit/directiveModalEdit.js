'use strict';

require('app')
  .directive('modalEdit', modalEdit);
/**
 * directive modalEdit
 * @ngInject
 */
function modalEdit(
  $localStorage,
  keypather,
  configUserContentDomain
) {
  return {
    restrict: 'A',
    templateUrl: 'viewModalEdit',
    scope: {
      data: '=',
      currentModel: '=',
      stateModel: '=',
      actions: '=',
      defaultActions: '='
    },
    link: function ($scope, element, attrs) {
      // Add thing
      $scope.validation = {};
      $scope.tempModel = {};
      $scope.configUserContentDomain = configUserContentDomain;

      $scope.popoverExposeInstruction = {
        data: {
          show: false
        },
        actions: {}
      };

      $scope.pasteLinkedInstance = function (text) {
        $scope.$broadcast('eventPasteLinkedInstance', text);
      };
      $scope.data.hideGuideHelpEnvModal =
          keypather.get($localStorage, 'guides.hideGuideHelpEnvModal') || false;

      $scope.onChangeHideGuideEnv = function () {
        $scope.data.hideGuideHelpEnvModal = true;
        keypather.set($localStorage, 'guides.hideGuideHelpEnvModal', true);
      };
    }
  };
}
