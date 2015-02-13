'use strict';

require('app')
  .controller('ControllerNew', ControllerNew);
/**
 * @ngInject
 */
function ControllerNew(
  errs,
  createNewBuild,
  $scope,
  $state
) {
  $scope.dataApp.data.loading = true;
  var unwatch = $scope.$watch('dataApp.data.activeAccount', function (account) {
    if (account) {
      unwatch();
      createNewBuild(account).then(function (build) {
        $scope.dataApp.data.loading = false;
        $state.go('instance.setup', {
          userName: $state.params.userName,
          buildId: build.id()
        });
      }).catch(errs.handler);
    }
  });
}
