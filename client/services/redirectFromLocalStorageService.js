'use strict';

require('app')
  .factory('redirectFromLocalStorage', redirect);

function redirect(
  $localStorage,
  $state,
  $window,
  keypather
) {
  return {
    toApp: function(demoName) {
      var appUrl = keypather.get($localStorage, 'demo.' + demoName + '.app');
      if (appUrl) {
        $window.location.href = appUrl;
      } else {
        $state.go('noAccess');
      }
    },
    toRunApp: function(demoName) {
      var demoObject = keypather.get($localStorage, 'demo.' + demoName + '.runnable');

      if (demoObject) {
        var userName = demoObject.userName;
        var instanceName = demoObject.instanceName;

        $state.go('base.instances.instance', {userName: userName, instanceName: instanceName});
      } else {
        $state.go('noAccess');
      }
    }
  };
}
