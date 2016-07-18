'use strict';

require('app')
  .factory('createNewSandboxForUserService', createNewSandboxForUserService);

function createNewSandboxForUserService(
  fetchUser,
  promisify
) {
  return function (orgName) {
    return fetchUser()
      .then(function (user) {
        return promisify(user, 'createUserWhitelist')({ name: orgName });
      });
  };
}
