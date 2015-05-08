'use strict';

require('app')
  .factory('setLastInstance', setLastInstance);

function setLastInstance(
  fetchUser,
  promisify,
  errs
) {
  return function (instanceName) {
    return fetchUser().then(function (user){
      return promisify(user, 'update')({
        'userOptions.uiState.previousLocation.instance': instanceName
      });
    }).catch(errs.handler);
  };
}