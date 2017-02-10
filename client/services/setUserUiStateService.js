'use strict';

require('app')
  .factory('setUiState', setUiState)
  .factory('setSeenExplanationUi', setSeenExplanationUi);

function setUiState(
  fetchUser,
  promisify,
  errs
) {
  return function (path, value) {
    var opts = {};
    opts['userOptions.uiState.' + path] = value;
    return fetchUser()
      .then(function (user){
        return promisify(user, 'update')(opts);
      })
      .catch(errs.handler);
  };
}

function setSeenExplanationUi(
  setUiState
) {
  return function () {
    return setUiState('demo.explanationUi', true);
  };
}