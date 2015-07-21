'use strict';

require('app')
  .controller('ControllerBranchSelection', controllerBranchSelection);

function controllerBranchSelection (
  $scope,
  $state,
  $window,
  fetchInstances,
  promisify,
  errs,
  user
) {
  var hostname = $state.params.hostname;
  $scope.loading = true;

  fetchInstances({
    hostname: hostname
  })
  .then(function (instances) {
    $scope.instances = instances;
    $scope.loading = false;
  })
  .catch(errs.handler);

  $scope.selectInstance = function (instance) {
    promisify(user, 'createRoute')({
      srcHostname: hostname,
      destInstanceId: instance.id()
    })
    .then(function () {
      $window.location = '//' + hostname;
    })
    .catch(errs.handler);
  };
}