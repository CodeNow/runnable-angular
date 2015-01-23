'use strict';

require('app')
  .factory('createNewInstance', createNewInstance);

function createNewInstance(
) {
  return function (activeAccount, build, opts, instances) {
    return function (returnBuild, cb) {
      if (typeof returnBuild === 'function') {
        cb = returnBuild;
      } else {
        build = returnBuild;
      }
      build.build({
        message: 'Initial Build'
      }, function (err) {
        if (err) {
          return cb(err);
        }
        opts.owner = {
          github: activeAccount.oauthId()
        };
        opts.build = build.id();
        instances.create(opts, function (err, instance) {
          cb(err);
        });
      });
    };
  };
}
