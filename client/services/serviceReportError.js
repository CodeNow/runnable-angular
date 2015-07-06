'use strict';

require('app')
  .factory('reportError', reportError);

function reportError(
  keypather,
  $rootScope
) {
  return function (err, options) {
    if (window.NREUM) {
      window.NREUM.noticeError(err, options);
    }
    if (window.Rollbar) {

      var user = {};
      user.email = keypather.get($rootScope, 'dataApp.data.user.attrs.email');
      user.username = keypather.get($rootScope, 'dataApp.data.user.oauthName()');
      user.id = keypather.get($rootScope, 'dataApp.data.user.attrs.id');

      window.Rollbar.configure({
        payload: {
          person: user
        }
      });


      window.Rollbar.error(err, options);
    }
  };
}
