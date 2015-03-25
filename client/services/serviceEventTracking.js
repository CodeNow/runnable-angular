/**
 * Wrapper of event-tracking functionality; making use of various
 * 3rd party analytics platforms.
 * - Intercom
 * - Mixpanel
 */
'use strict';

require('app')
  .service('eventTracking', EventTracking);

var User = require('runnable/lib/models/user');
var _keypather;

// constants
var INTERCOM_APP_ID = 'wqzm3rju';

/**
 * EventTracking
 * @class
 */
function EventTracking (
  $log,
  $state,
  $window,
  isFunction,
  keypather
) {
  _keypather = keypather;
  this._Intercom = $window.Intercom;
  //this._mixpanel = $window.mixpanel;
  this._state = $state;
  if (!this._Intercom) {
    // stub intercom if not present
    this._Intercom = function () {
      $log.info('Intercom JS SDK stubbed');
      $log.info(arguments);
    };
  }

  /**
   * Wrap invokations of mixpanel SDK API methods (object properties)
   * @param {String} mixpanel SDK API method name
   * @params [1..n] optional arguments passed to mixpanel SDK
   */
  this._mixpanel = function () {
    if (!isFunction(keypather.get($window, 'mixpanel.'+arguments[0]))) {
      $log.info('Mixpanel JS SDK stubbed');
      $log.info(arguments);
      return;
    }
    var args = Array.prototype.slice.call(arguments);
    var path = args[0].split('.');
    // contextPath: "foo.bar.biz.bang" -> "foo.bar.biz" || "foo.bar.biz" -> "foo.bar"
    var contextPath = path.slice(0, path.length-1).join('');
    var context = keypather.get($window.mixpanel, contextPath);
    _keypather.get($window, 'mixpanel.'+arguments[0])
      .apply(context, args.slice(1, args.length));
  };
}

/**
 * Intercom and Mixpanel user identification
 * @throws Error
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
  this._mixpanel('identify', user.oauthId());
  var userJSON = user.toJSON();
  var firstName = '';
  var lastName = '';
  var displayName = _keypather.get(userJSON, 'accounts.github.displayName');
  if (displayName) {
    firstName = displayName.split(/ (.+)/)[0];
    lastName = displayName.split(/ (.+)/)[1];
  }
  this._mixpanel('people.set', {
    '$first_name': firstName,
    '$last_name': lastName,
    '$created': _keypather.get(userJSON, 'created'),
    '$email': _keypather.get(userJSON, 'email')
  });
};

/**
 * Record user event toggling of selected commit in repository
 * Reports to:
 *   - mixpanel
 * @param {Object} data - key/value pairs of event data
 *   - keys
   *   - triggeredBuild: Boolean
   *   - slectedCommit: Object (ACV Model)
 * @return null
 */
EventTracking.prototype.toggledCommit = function (data) {
  var eventName = 'toggled-commit';
  var eventData = {
    triggeredBuild: !!data.triggeredBuild,
    selectedCommit: data.acv,
    state: this._state.$current.name
  };
  this._mixpanel('track', eventName, eventData);
};

/**
 * Record user-initiated build triggered event from throughout UI
 * Reports to:
 *   - intercom
 *   - mixpanel
 * @param {Boolean} cache - build triggered without cache
 * @return null
 */
EventTracking.prototype.triggeredBuild = function (cache) {
  var eventName = 'triggered-build';
  var eventData = {
    cache: cache,
    state: this._state.$current.name
  };
  this._Intercom('trackEvent', eventName, eventData);
  this._mixpanel('track', eventName, eventData);
};

/**
 * Intercom JS SDK API update method wrapper
 * Checks for & displays new messages from Intercom
 * @return null
 */
EventTracking.prototype.update = function () {
  this._Intercom('update');
};

