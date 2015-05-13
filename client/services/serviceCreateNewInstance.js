'use strict';

require('app')
  .factory('createNewInstance', createNewInstance);

function createNewInstance(
  fetchUser,
  promisify
) {
  return function (activeAccount, build, opts, instanceModel) {
    return promisify(build, 'build')({
      message: 'Initial Build'
    }).then(function () {
      opts.owner = {
        github: activeAccount.oauthId()
      };
      opts.build = build.id();
      if (instanceModel) {
        return promisify(instanceModel, 'create')(
          opts
        );
      } else {
        return fetchUser().then(function (user) {
          return promisify(user, 'createInstance')(
            opts
          );
        });
      }
    });
  };
}
