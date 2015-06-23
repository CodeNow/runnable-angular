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
var _$location;
var INTERCOM_APP_ID;

/**
 * EventTracking
 * @class
 */
function EventTracking (
  $location,
  $log,
  $state,
  $stateParams,
  $window,
  assign,
  keypather,
  configEnvironment
) {
  if (configEnvironment === 'production') {
    INTERCOM_APP_ID = 'wqzm3rju'; // production ID
  } else {
    INTERCOM_APP_ID = 'xs5g95pd'; // test ID
  }
  _keypather = keypather;
  _$location = $location;

  this._Intercom = $window.Intercom;
  this._baseEventData = {};
  this._user = null;
  // store events invoked before boot
  this._preBootEventQueue = [];

  /**
   * Extend per-event data with specific properties
   * to be sent w/ all events
   * @param {Object} data - data for given event to be extended
   * @return Object - extended event object
   */
  this.extendEventData = function (data) {
    if (!this._user) {
      $log.error('eventTracking.boot() must be invoked before reporting events');
    }
    // username owner if server page
    // name of server if server page
    // page event triggered from
    var baseData = {
      state: $state.$current.name,
      href: $window.location.href
    };
    if (angular.isFunction(keypather.get(this._user, 'oauthName'))) {
      baseData.userName = this._user.oauthName();
    }
    if ($stateParams.userName) {
      baseData.instanceOwner = $stateParams.userName;
    }
    if ($stateParams.instanceName) {
      baseData.instanceName = $stateParams.instanceName;
    }
    return assign(data, baseData);
  };

  /**
   * Stub Intercom when SDK not present
   * (development/staging environments)
   */
  if (!this._Intercom) {
    // stub intercom if not present
    this._Intercom = function () {
      // $log.info('Intercom JS SDK stubbed');
      // $log.info(arguments);
    };
  }

  /**
   * Wrap invokations of mixpanel SDK API methods (object properties)
   * @param {String} mixpanel SDK API method name
   * @params [1..n] optional arguments passed to mixpanel SDK
   */
  this._mixpanel = function () {
    if (!angular.isFunction(keypather.get($window, 'mixpanel.'+arguments[0]))) {
      // $log.info('Mixpanel JS SDK stubbed');
      // $log.info(arguments);
      return;
    }
    var args = Array.prototype.slice.call(arguments);
    var path = args[0].split('.');
    // contextPath: "foo.bar.biz.bang" -> "foo.bar.biz" || "foo.bar.biz" -> "foo.bar"
    var contextPath = path.slice(0, path.length-1).join('');
    var context = keypather.get($window.mixpanel, contextPath);
    keypather.get($window, 'mixpanel.'+arguments[0])
      .apply(context, args.slice(1, args.length));
  };
}

/**
 * Intercom and Mixpanel user identification
 * @throws Error
 * @param {Object} user - User Model instance
 * @return this
 */
EventTracking.prototype.boot = function (user) {
  if (this._user) { return this; }
  if (!(user instanceof User)) {
    throw new Error('arguments[0] must be instance of User');
  }
  this._user = user;
  var data = {
    name: user.oauthName(),
    email: user.attrs.email,
    created_at: new Date(user.attrs.created) / 1000 | 0,
    app_id: INTERCOM_APP_ID
  };

  // Mixpanel uses a string GUID to track anon users
  // If we're still tracking the user via GUID, we need to alias
  // Otherwise, we can just identify ourselves
  if (angular.isString(this._mixpanel('get_distinct_id'))) {
    this._mixpanel('alias', user.oauthId());
  } else {
    this._mixpanel('identify', user.oauthId());
  }
  this._Intercom('boot', data);
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
  return this;
};

/**
 * Record user event toggling of selected commit in repository
 * Reports to:
 *   - mixpanel
 * @param {Object} data - key/value pairs of event data
 *   - keys
   *   - triggeredBuild: Boolean
   *   - slectedCommit: Object (ACV Model)
 * @return this
 */
EventTracking.prototype.toggledCommit = function (data) {
  var eventName = 'toggled-commit';
  var eventData = this.extendEventData({
    triggeredBuild: !!data.triggeredBuild,
    selectedCommit: data.acv
  });
  this._mixpanel('track', eventName, eventData);
  return this;
};

/**
 * Record user-initiated build triggered event from throughout UI
 * Reports to:
 *   - intercom
 *   - mixpanel
 * @param {Boolean} cache - build triggered without cache
 * @return this
 */
EventTracking.prototype.triggeredBuild = function (cache) {
  var eventName = 'triggered-build';
  var eventData = this.extendEventData({
    cache: cache
  });
  this._Intercom('trackEvent', eventName, eventData);
  this._mixpanel('track', eventName, eventData);
  return this;
};

/**
 * Record user visit to states
 * Reports to:
 *   - mixpanel
 * @return this
 */
EventTracking.prototype.visitedState = function () {
  var eventName = 'visited-state';
  var eventData = this.extendEventData({
    referral: _$location.search().ref || 'direct'
  });
  this._mixpanel('track', eventName, eventData);
  return this;
};

/**
 * Intercom JS SDK API update method wrapper
 * Checks for & displays new messages from Intercom
 * @return this
 */
EventTracking.prototype.update = function () {
  this._Intercom('update');
  return this;
};

