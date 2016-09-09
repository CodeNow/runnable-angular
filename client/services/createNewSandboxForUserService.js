'use strict';

require('app')
  .factory('createNewSandboxForUserService', createNewSandboxForUserService);

function createNewSandboxForUserService(
  eventTracking,
  fetchUser,
  promisify
) {
  return function (orgName) {
    return fetchUser()
      .then(function (user) {
        eventTracking.waitingForInfrastructure(orgName);
        return promisify(user, 'createUserWhitelist')({ name: orgName });
      });
  };
}
