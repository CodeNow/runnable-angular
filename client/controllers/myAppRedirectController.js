'use strict';

require('app')
  .controller('MyAppRedirectController', MyAppRedirectController);
/**
 * @ngInject
 */
function MyAppRedirectController(
  $localStorage,
  $state,
  $window
) {
  var demoName = $state.params.demoName;

  if (demoName && $localStorage.demo && $localStorage.demo[demoName] && $localStorage.demo[demoName].app) {
    $window.location.href = $localStorage.demo[demoName].app;
  } else {
    $state.go('noAccess');
  }
}
