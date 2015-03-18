/**
 * Wrapper of event-tracking functionality; making use of various
 * 3rd party analytics platforms. (Intercom, Datadog)
 */
'use strict';

require('app')
  .service('eventTracking', EventTracking);

// constants
var APP_ID = 'wqzm3rju';

/**
 * EventTracking
 * @class
 */
function EventTracking (
  $log,
  $state,
  $window
) {
  this._state = $state;
  if (!$window.Intercom) {
    // stub intercom if not loaded
    this._Intercom = function () {
      $log.info('Intercom JS SDK stubbed');
      $log.info(arguments);
    };
    return;
  }
  this._Intercom = $window.Intercom;
}

/**
 * Intercom JS SDK API boot method wrapper
 * @param {Object} user - User Model instance
 * @return null
 */
EventTracking.prototype.boot = function (user) {
  var data = {
    name: user.oauthName(),
    email: user.attrs.email,
    created_at: +(new Date(user.attrs.created)),
    app_id: APP_ID
  };
  this._Intercom('boot', data);
};

/**
 * Record user-initiated build triggered event from throughout UI
 * @param {Boolean} noCache - build triggered without cache
 * @return null
 */
EventTracking.prototype.triggeredBuild = function (noCache) {
  this._Intercom('trackEvent', 'triggered-build', {
    noCache: noCache,
    state: this._state.$current.name
  });
};

/**
 * Intercom JS SDK API update method wrapper
 * Checks for & displays new messages from Intercom
 * @return null
 */
EventTracking.prototype.update = function () {
  this._Intercom('update');
};

