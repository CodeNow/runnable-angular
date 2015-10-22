'use strict';

require('app')
  .factory('report', report);

function report(
  keypather,
  $window
) {
  var levels = ['critical', 'error', 'warning', 'info', 'debug'];
  var reporter = function (level, message, options) {
    if (!message) {
      return;
    }

    console.log(message, level, options);
    if (levels.indexOf(level) === -1) {
      window.Rollbar.warning('Attempt to report invalid level of error ' + level + ' with message ' + JSON.stringify(message));
      return;
    }
    if (level === 'error' && window.NREUM) {
      window.NREUM.noticeError(message, options);
    }
    if (window.Rollbar) {
      window.Rollbar[level](message, options);
    }
    if ($window.trackJs) {
      $window.trackJs.track(message);
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
    if ($window.trackJs) {
      $window.trackJs.configure({
        userId: keypather.get(user, 'oauthName()')
      });
    }
  };

  return reporter;
}
