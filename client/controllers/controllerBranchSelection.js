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
  apiClientBridge
) {
  var hostname = $state.params.hostname;
  $scope.loading = true;

  var masterInstance;
  fetchInstances({
    hostname: hostname,
    masterPod: true
  })
  .then(function (_masterInstance) {
    masterInstance = _masterInstance;
    var context = masterInstance.attrs.contextVersion.context;
    return promisify(masterInstance.children, 'fetch')();
  })
  .then(function (instances) {
    instances.add(masterInstance);
    $scope.instances = instances;
    $scope.loading = false;
  })
  .catch(errs.handler);

  $scope.selectInstance = function (instance) {
    promisify(apiClientBridge, 'createRoute')({
      srcHostname: hostname,
      destInstanceId: instance.id()
    })
    .then(function () {
      $window.location = '//' + hostname;
    })
    .catch(errs.handler);
  };
}