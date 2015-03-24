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
    keypather.get($window, 'mixpanel.'+arguments[0])
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
  this._mixpanel('people.set', user.toJSON());
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

