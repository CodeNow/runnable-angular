'use strict';

require('app')
  .service('createServerObjectFromInstance', createServerObjectFromInstance);

function createServerObjectFromInstance(
  keypather
) {
  return function (instance) {
    var server = {};

    server.instance = instance;
    server.build = instance.build;
    server.opts = {
      env: instance.attrs.env
    };

    if (!instance.contextVersion) { return server; }

    server.contextVersion = instance.contextVersion;
    server.advanced = keypather.get(instance, 'contextVersion.attrs.advanced');
    server.repo = keypather.get(instance, 'contextVersion.getMainAppCodeVersion().githubRepo');

    return server;
  };
}