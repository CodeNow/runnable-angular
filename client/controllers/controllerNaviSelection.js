'use strict';

require('app')
  .controller('ControllerNaviSelection', controllerNaviSelection);

function controllerNaviSelection (
  $scope,
  $state,
  fetchInstances,
  promisify,
  errs,
  user
) {
  var hostname = $state.params.hostname;
  console.log(hostname);

  fetchInstances({
    hostname: hostname,
    masterPod: true
  })
  .then(function (masterInstance) {
    var context = masterInstance.attrs.contextVersion.context;
    return fetchInstances({
      'contextVersion.context': context
    });
  })
  .then(function (something) {
      // instances.url() // doesn't exist ryan needs this method too: // url() needs to be created on the instance model in api client (it should return instance.name+'-'instance.owner.username+'.'+process.env.USER_CONTENT_DOMAIN)
  })
  .catch(errs.handler);

  $scope.dataNaviSelection = {
    data: {
      greeting: 'hello'
    },
    actions: {
      selectInstance: function (instance) {
        // instance url
        // TBD
        var body = {};
        var hostname = hostname;
        body['hostnamesMap.' + hostname] = instance.id();
        promisify(user, 'update')(body)
        .then(function () {
          // Session is set
        })
        .catch(errs.handler);
      }
    }
  };
}