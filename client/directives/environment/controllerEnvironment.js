'use strict';

require('app')
  .controller('ControllerEnvironment', ControllerEnvironment);
/**
 * ControllerEnvironment
 * @param $scope
 * @constructor
 * @export
 * @ngInject
 */
function ControllerEnvironment(
  $scope,
  $rootScope,
  $state,
  $stateParams,
  $log,
  keypather,
  OpenItems,
  favico,
  fetchBuild,
  fetchInstances,
  pageName,
  JSTagsCollection,
  $window
) {
  favico.reset();
  $scope.data = {
    dataModalEditServer: {
      portTagOptions: {
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
        tags: new JSTagsCollection([])
      }
    }
  };
  $scope.actions = {
    selectAccount: function (account) {
      $scope.data.activeAccount = account;
    }
  };


  $scope.$on('$destroy', function () {
  });

}
