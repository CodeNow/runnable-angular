'use strict';

require('app')
  .controller('ReadOnlySwitchController', ReadOnlySwitchController);
/**
 * @ngInject
 */
function ReadOnlySwitchController(
  $scope,
  errs,
  loadingPromises,
  promisify
) {
  function rollback() {
    // This code is waiting for api and a different task.  But this is the code, it's not junk
    //$scope.state.promises.contextVersion = $scope.state.promises.contextVersion
    //  .then(function (contextVersion) {
    //    return loadingPromises.add($scope.loadingPromisesTarget, promisify(contextVersion, 'rollback')());
    //  })
    //  .then(function (contextVersion) {
    //    $scope.state.contextVersion = contextVersion;
    //    return contextVersion;
    //  })
    //  .catch(errs.handler)
    //  .finally(function () {
    //    return $scope.state.contextVersion;
    //  });
  }
  // Getter/setter
  this.readOnly = function (newAdvancedMode) {
    // when setting to readOnly
    if (arguments.length) {
      if (newAdvancedMode) {
        $scope.state.advanced = newAdvancedMode;
        $scope.state.promises.contextVersion
          .then(function (contextVersion) {
            return loadingPromises.add($scope.loadingPromisesTarget,
              promisify(contextVersion, 'update')({
                advanced: newAdvancedMode
              })
              .then(function () {
                promisify(contextVersion, 'fetch')();
              }));
          })
          .catch(function (err) {
            errs.handler(err);
            $scope.state.advanced = !newAdvancedMode;
          });
      } else {
        // If switching from advanced to basic
        if (confirm('You will lose all changes you\'ve made to your dockerfile (ever).')) {
          rollback();
        }
      }
    } else {
      return $scope.state.advanced;
    }
  };
}
