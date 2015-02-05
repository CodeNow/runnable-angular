'use strict';

require('app')
  .directive('setupPrimaryActions', setupPrimaryActions);
/**
 * @njInject
 */
function setupPrimaryActions(
  async,
  $state,
  $stateParams,
  createNewInstance
) {
  return {
    restrict: 'E',
    templateUrl: 'viewSetupPrimaryActions',
    scope: {
      activeAccount: '=',
      data: '=',
      loading: '=',
      name: '=',
      isDockerFileValid: '=',
      isNameValid: '=',
      openItems: '=',
      instanceOpts: '='
    },
    link: function ($scope, elem, attrs) {

      function goToInstance() {
        $state.go('instance.instance', {
          userName: $stateParams.userName,
          instanceName: $scope.instanceOpts.name
        });
      }

      $scope.buildAndAttach = function () {
        $scope.loading = true;
        $scope.instanceOpts.name = $scope.name;
        var unwatch = $scope.$watch('openItems.isClean()', function (n) {
          if (!n) {
            return;
          }
          unwatch();
          createNewInstance(
            $scope.activeAccount,
            $scope.data.build,
            $scope.instanceOpts
          )(function (err) {
            if (err) { throw err; }
            $scope.loading = false;
            goToInstance();
          });
        });
      };
    }
  };
}
