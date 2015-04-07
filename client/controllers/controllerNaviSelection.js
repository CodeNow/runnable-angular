'use strict';

require('app')
  .controller('ControllerNaviSelection', controllerNaviSelection);

function controllerNaviSelection (
  $scope,
  fetchInstances,
  promisify,
  errs,
  user
) {
  var url = require('url');

  console.log(url.parse(window.location.origin));

  fetchInstances({
    hostname: url.parse(window.location.origin).hostname,
    masterPod: true
  })
  .then(function (masterInstance) {
    var context = masterInstance.attrs.contextVersion.context;
    var urlInstances = user.fetchInstances({ 'contextVersion.context': context }, function (err) {
      if (err) { return '';}
      // instances.url() // doesn't exist ryan needs this method too: // url() needs to be created on the instance model in api client (it should return instance.name+'-'instance.owner.username+'.'+process.env.USER_CONTENT_DOMAIN)
    });
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
        var hostname = url.parse(window.location.origin).hostname;
        body['hostnamesMap.'+hostname] = instance.id();
        user.update(body, function (err) {
          // session is set.
        });
      }
    }
  };
}