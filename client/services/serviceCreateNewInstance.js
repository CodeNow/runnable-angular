'use strict';

require('app')
  .factory('createNewInstance', createNewInstance);

function createNewInstance(
  pFetchUser,
  promisify
) {
  return function (activeAccount, build, opts, message) {
    return promisify(build, 'build')({
      message: message || 'Initial Build'
    }).then(function () {
      opts.owner = {
        github: activeAccount.oauthId()
      };
      opts.build = build.id();
      return pFetchUser().then(function (user) {
        return promisify(user, 'createInstance')(
          opts
        );
      });
    });
  };
}
