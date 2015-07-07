'use strict';

require('app')
  .factory('reportError', reportError);

function reportError(
  keypather
) {
  var errorReporter =  function (err, options) {
    if (!err) {
      return;
    }
    if (window.NREUM) {
      window.NREUM.noticeError(err, options);
    }
    if (window.Rollbar) {
      window.Rollbar.error(err, options);
    }
  };

  errorReporter.setUser = function (user) {
    if (window.Rollbar) {
      var setUser = {};
      setUser.email = keypather.get(user, 'attrs.email');
      setUser.username = keypather.get(user, 'oauthName()');
      setUser.id = keypather.get(user, 'oauthId()');

      window.Rollbar.configure({
        payload: {
          person: setUser
        }
      });
    }
  };

  return errorReporter;
}
