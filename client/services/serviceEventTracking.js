/**
 * Wrapper of event-tracking functionality; making use of various
 * 3rd party analytics platforms. (Intercom, Datadog)
 */
'use strict';

require('app')
  .service('eventTracking', EventTracking);

var User = require('runnable/lib/models/user');

// constants
var INTERCOM_APP_ID = 'wqzm3rju';

/**
 * EventTracking
 * @class
 */
function EventTracking (
  $log,
  $state,
  $window
) {
  this._Intercom = $window.Intercom;
  this._mixpanel = $window.mixpanel;
  this._state = $state;
  if (!this._Intercom) {
    // stub intercom if not present
    this._Intercom = function () {
      $log.info('Intercom JS SDK stubbed');
      $log.info(arguments);
    };
  }
  if (!this._mixpanel) {
    // stub mixpanel if not present
    this._mixpanel = function () {
      $log.info('mixpanel JS SDK stubbed');
      $log.info(arguments);
    };
  }
}

/**
 * Intercom and Mixpanel user identification
 * @param {Object} user - User Model instance
 * @return null
 */
EventTracking.prototype.boot = function (user) {
  if (!(user instanceof User)) {
    throw new Error('arguments[0] must be instance of User');
  }
  var data = {
    name: user.oauthName(),
    email: user.attrs.email,
    created_at: +(new Date(user.attrs.created)),
    app_id: INTERCOM_APP_ID
  };
  this._Intercom('boot', data);
  this._mixpanel.identify(user.oauthId());
};

/**
 * Record user-initiated build triggered event from throughout UI
 * @param {Boolean} cache - build triggered without cache
 * @return null
 */
EventTracking.prototype.triggeredBuild = function (cache) {
  this._Intercom('trackEvent', 'triggered-build', {
    cache: cache,
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

