'use strict';

require('app')
  .factory('setLastOrg', setLastOrg);

function setLastOrg(
  pFetchUser,
  promisify,
  errs
) {
  return function (orgName) {
    console.log('Setting last org', orgName);
    return pFetchUser().then(function (user){
      return promisify(user, 'update')({
        'userOptions.uiState.previousLocation.org': orgName
      });
    }).catch(errs.handler);
  };
}