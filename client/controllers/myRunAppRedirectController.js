'use strict';

require('app')
  .controller('MyRunAppRedirectController', MyRunAppRedirectController);
/**
 * @ngInject
 */
function MyRunAppRedirectController(
  $localStorage,
  $state
) {
  var demoName = $state.params.demoName;

  if (demoName && $localStorage.demo && $localStorage.demo[demoName] && $localStorage.demo[demoName].runnable) {
    var userName = $localStorage.demo[demoName].runnable.userName;
    var instanceName = $localStorage.demo[demoName].runnable.instanceName;

    $state.go('base.instances.instance', {userName: userName, instanceName: instanceName});
  } else {
    $state.go('noAccess');
  }
}
