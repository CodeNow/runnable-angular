'use strict';

require('app')
  .controller('ControllerNaviSelection', controllerNaviSelection);

function controllerNaviSelection (
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

  var masterInstance;
  fetchInstances({
    hostname: hostname,
    masterPod: true
  })
  .then(function (_masterInstance) {
    masterInstance = _masterInstance;
    var context = masterInstance.attrs.contextVersion.context;
    return promisify(masterInstance, 'fetchDependencies')({
      'contextVersion.context': context
    });
  })
  .then(function (instances) {
    instances.add(masterInstance);
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
      $window.location = 'http://' + hostname;
    })
    .catch(errs.handler);
  };
}