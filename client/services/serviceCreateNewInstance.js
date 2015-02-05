'use strict';

require('app')
  .factory('createNewInstance', createNewInstance);

function createNewInstance(
) {
  return function (activeAccount, build, opts) {
    return function (cb) {
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
        activeAccount.createInstance(opts, function (err) {
          cb(err);
        });
      });
    };
  };
}
