'use strict';

require('app')
  .factory('report', report);

function report(
  keypather,
  featureFlags
) {
  var levels = ['critical', 'error', 'warning', 'info', 'debug'];
  var reporter = function (level, message, options) {
    if (!message) {
      return;
    }

    // We want to report if feature flags are turned on so we can better debug issues.
    if (featureFlags.changed()){
      options.featureFlags = featureFlags.getModifiedFlags();
    }

    console.log(message);
    if (levels.indexOf(level) === -1) {
      window.Rollbar.warning('Attempt to report invalid level of error '+ level + ' with message '+JSON.stringify(message));
      return;
    }
    if (level === 'error' && window.NREUM) {
      window.NREUM.noticeError(message, options);
    }
    if (window.Rollbar) {
      window.Rollbar[level](message, options);
    }
  };

  levels.forEach(function (level) {
    reporter[level] = function (message, options) {
      reporter(level, message, options);
    };
  });

  reporter.setUser = function (user) {
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

  return reporter;
}
