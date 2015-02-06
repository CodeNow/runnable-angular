'use strict';

require('app')
  .factory('createNewInstance', createNewInstance);

function createNewInstance(
  pFetchUser
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
        pFetchUser().then(function (user) {
          user.createInstance(opts, function (err) {
            cb(err);
          });
        }).catch(cb);
      });
    };
  };
}
