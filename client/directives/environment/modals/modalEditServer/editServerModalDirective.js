'use strict';

require('app')
  .directive('editServerModal', editServerModal);
/**
 * @ngInject
 */
function editServerModal(
  JSTagsCollection
) {
  return {
    restrict: 'A',
    templateUrl: 'editServerModalView',
    scope: {
      actions: '=',
      data: '=',
      defaultActions: '=',
      currentModel: '=',
      stateModel: '='
    },
    link: function ($scope, elem, attrs) {
      $scope.portTagOptions = {
        breakCodes: [
          13, // return
          32, // space
          44, // comma (opera)
          188 // comma (mozilla)
        ],
        texts: {
          'inputPlaceHolder': 'Add ports here',
          maxInputLength: 5,
          onlyDigits: true
        },
        tags: new JSTagsCollection($scope.currentModel.ports || [])
      };

      $scope.changeTab = function (tabname) {
        if (!$scope.editServerForm.$invalid) {
          $scope.stateModel = tabname;
        }
      };
    }
  };
}
