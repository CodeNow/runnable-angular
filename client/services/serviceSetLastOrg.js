'use strict';

require('app')
  .factory('setLastOrg', setLastOrg);

function setLastOrg(
  fetchUser,
  promisify,
  errs
) {
  return function (orgName) {
    return fetchUser().then(function (user){
      return promisify(user, 'update')({
        'userOptions.uiState.previousLocation.org': orgName
      });
    }).catch(errs.handler);
  };
}