/**
 * Wrapper of event-tracking functionality; making use of various
 * 3rd party analytics platforms.
 * - Intercom
 * - Mixpanel
 */
'use strict';

require('app')
  .service('eventTracking', EventTracking);
var User = require('@runnable/api-client/lib/models/user');
var UUID = require('node-uuid');
var _keypather;
var _$location;
var INTERCOM_APP_ID;
var SIFT_API_KEY;

/**
 * EventTracking
 * @class
 */
function EventTracking(
  $browser,
  $location,
  $log,
  $state,
  $stateParams,
  $window,
  assign,
  keypather,
  configEnvironment,
  siftApiConfig
) {
  var self = this;
  SIFT_API_KEY = siftApiConfig;

  if (configEnvironment === 'production') {
    INTERCOM_APP_ID = 'wqzm3rju'; // production ID
  } else {
    INTERCOM_APP_ID = 'xs5g95pd'; // test ID
  }
  _keypather = keypather;
  _$location = $location;

  self.analytics = $window.analytics;
  self._user = null;
  self.$window = $window;
  self.isModerating = !!$browser.cookies().isModerating;

  /**
   * Extend per-event data with specific properties
   * to be sent w/ all events
   * @param {Object} data - data for given event to be extended
   * @return Object - extended event object
   */
  self.extendEventData = function (data) {
    if (!self._user) {
      $log.error('eventTracking.boot() must be invoked before reporting events');
    }
    // username owner if server page
    // name of server if server page
    // page event triggered from
    var baseData = {
      state: $state.$current.name,
      href: $window.location.href
    };
    if (angular.isFunction(keypather.get(self._user, 'oauthName'))) {
      baseData.userName = self._user.oauthName();
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
  if (!self.$window.Intercom) {
    // stub intercom if not present
    self.$window.Intercom = angular.noop;
  }

  if (self.isModerating) {
    self.$window.intercomSettings = {
      hide_default_launcher: true
    };
  }

  /**
   * Stub Segment when SDK not present
   * (development/staging environments)
   */
  if (!self.analytics) {
    // stub segment (analytics) if not present
    self.analytics = {
      ready: angular.noop,
      track: angular.noop,
      identify: angular.noop,
      alias: angular.noop,
      page: angular.noop,
      group: angular.noop,
      trackLink: angular.noop,
      trackForm: angular.noop,
      user: angular.noop,
      debug: angular.noop,
      on: angular.noop,
      timeout: angular.noop
    };
  }

  /**
   * Wrap invokations of mixpanel SDK API methods (object properties)
   * @param {String} mixpanel SDK API method name
   * @params [1..n] optional arguments passed to mixpanel SDK
   */
  self._mixpanel = function () {
    if (!angular.isFunction(keypather.get($window, 'mixpanel.'+arguments[0]))) {
      // $log.info('Mixpanel JS SDK stubbed');
      // $log.info(arguments);
      return;
    }
    var args = Array.prototype.slice.call(arguments);
    var path = args[0].split('.');
    // contextPath: "foo.bar.biz.bang" -> "foo.bar.biz" || "foo.bar.biz" -> "foo.bar"
    var contextPath = path.slice(0, path.length - 1).join('');
    var context = keypather.get($window.mixpanel, contextPath);
    keypather.get($window, 'mixpanel.' + arguments[0])
      .apply(context, args.slice(1, args.length));
  };
}

/**
 * Intercom, Mixpanel, and Segment user identification
 * @throws Error
 * @param {Object} user - User Model instance
 * @return this
 */
EventTracking.prototype.boot = function (user, opts) {
  var self = this;
  opts = opts || {};
  // if (self._user) { return self; }
  if (!(user instanceof User)) {
    throw new Error('arguments[0] must be instance of User');
  }

  if (user.attrs._beingModerated) {
    user = new User(user.attrs._beingModerated, { noStore: true });
  } else {
    var session = window.sessionStorage.getItem('sessionId');
    if (!session) {
      session = UUID.v4();
      window.sessionStorage.setItem('sessionId', session);
    }

    var _sift = window._sift = window._sift || [];
    _sift.push(['_setAccount', SIFT_API_KEY]);
    _sift.push(['_setUserId', user.name]);
    _sift.push(['_setSessionId', session]);
    _sift.push(['_trackPageview']);

    self.analytics.ready(function () {
      self.analytics.track('ViewContent', {
        action: 'LoggedIn'
      });
    });
  }

  self._user = user;
  var data = {
    name: user.oauthName(),
    email: user.attrs.email,
    created_at: new Date(user.attrs.created) / 1000 || 0,
    app_id: INTERCOM_APP_ID
  };
  if (opts.orgName) {
    data.company = {
      id: opts.orgName.toLowerCase(),
      name: opts.orgName
    };
  }

  // Mixpanel uses a string GUID to track anon users
  // If we're still tracking the user via GUID, we need to alias
  // Otherwise, we can just identify ourselves
  if (angular.isString(self._mixpanel('get_distinct_id'))) {
    self._mixpanel('alias', user.oauthId());
  } else {
    self._mixpanel('identify', user.oauthId());
  }
  if (!self.isModerating) {
    self.$window.Intercom('boot', data);
  }
  var userJSON = user.toJSON();
  var firstName = '';
  var lastName = '';
  var displayName = _keypather.get(userJSON, 'accounts.github.displayName');
  if (displayName) {
    firstName = displayName.split(/ (.+)/)[0];
    lastName = displayName.split(/ (.+)/)[1];
  }
  self._mixpanel('people.set', {
    '$first_name': firstName,
    '$last_name': lastName,
    '$created': _keypather.get(userJSON, 'created'),
    '$email': _keypather.get(userJSON, 'email')
  });

  // Segment
  self.analytics.ready(function () {
    self.analytics.identify(data.name, {
      firstName: firstName,
      lastName: lastName,
      username: data.name,
      email: _keypather.get(userJSON, 'email'),
      createdAt: _keypather.get(userJSON, 'created'),
      avatar: _keypather.get(userJSON, 'gravatar')
    });
    self.analytics.alias(user.oauthId());
    self.analytics.alias(_keypather.get(userJSON, '_id'));
    if (opts.orgName) {
      self.analytics.group(data.company.id, {
        name: data.company.name
      });
    }
  });
  return self;
};

/**
 * Record user event toggling of selected commit in repository
 * Reports to:
 *   - mixpanel
 *   - segment
 * @param {Object} data - key/value pairs of event data
 *   - keys
   *   - triggeredBuild: Boolean
   *   - slectedCommit: Object (ACV Model)
 * @return this
 */
EventTracking.prototype.toggledCommit = function (data) {
  var self = this;
  var eventName = 'toggled-commit';
  var eventData = self.extendEventData({
    triggeredBuild: !!data.triggeredBuild,
    selectedCommit: data.acv
  });
  self._mixpanel('track', eventName, eventData);
  self.analytics.ready(function () {
    self.analytics.track(eventName, eventData);
  });
  return self;
};

/**
 * Record user-initiated build triggered event from throughout UI
 * Reports to:
 *   - intercom
 *   - mixpanel
 *   - segment
 * @param {Boolean} cache - build triggered without cache
 * @return this
 */
EventTracking.prototype.triggeredBuild = function (cache) {
  var self = this;
  var eventName = 'triggered-build';
  var eventData = self.extendEventData({
    cache: cache
  });
  if (!self.isModerating) {
    self.$window.Intercom('trackEvent', eventName, eventData);
  }
  self._mixpanel('track', eventName, eventData);
  self.analytics.ready(function () {
    self.analytics.track(eventName, eventData);
  });
  return self;
};

/**
 * Record user visit to states
 * Reports to:
 *   - mixpanel
 *   - segment
 * @return this
 */
EventTracking.prototype.visitedState = function () {
  var self = this;
  var eventName = 'visited-state';
  var eventData = self.extendEventData({
    referral: _$location.search().ref || 'direct'
  });
  self._mixpanel('track', eventName, eventData);
  self.analytics.ready(function () {
    self.analytics.track(eventName, eventData);
  });
  return self;
};

/**
 * Intercom JS SDK API update method wrapper
 * Checks for & displays new messages from Intercom
 * @return this
 */
EventTracking.prototype.update = function () {
  var self = this;
  if (!self.isModerating) {
    self.$window.Intercom('update');
  }
  return self;
};

/**
 * Track clicks on the page
 * @param data
 * @returns {EventTracking}
 */
EventTracking.prototype.trackClicked = function (data) {
  var self = this;

  self._mixpanel('track', 'Click', data);
  self.analytics.ready(function () {
    self.analytics.track('Click', data);
  });
  return self;
};

/**
 * Track creating repo containers
 * @param {String} orgName
 * @param {String} repoName
 * @returns {EventTracking}
 */
EventTracking.prototype.createdRepoContainer = function (org, repo) {
  var self = this;
  if (self._mixpanel) {
    self._mixpanel('track', 'createRepoContainer', {
      org: org,
      repo: repo
    });
  }

  self.analytics.ready(function () {
    self.analytics.track('ViewContent', {
      action: 'CreateContainer',
      type: 'Repo',
      containerName: repo
    });
  });
};

/**
 * Track creating non repo containers
 * @param {String} containerName
 * @returns {EventTracking}
 */
EventTracking.prototype.createdNonRepoContainer = function (containerName) {
  var self = this;
  if (self._mixpanel) {
    self._mixpanel('track', 'createNonRepoContainer', {
      containerName: containerName
    });
  }

  self.analytics.ready(function () {
    self.analytics.track('ViewContent', {
      action: 'CreateContainer',
      type: 'NonRepo',
      containerName: containerName
    });
  });
};

/**
 * Track user visit to /orgSelect page
 * Reports to:
 *   - mixpanel
 *   - segment
 * @return this
 */
EventTracking.prototype.visitedOrgSelectPage = function () {
  var self = this;
  var eventName = 'Visited org-select page';

  self._mixpanel('track', eventName);
  self.analytics.ready(function () {
    self.analytics.track(eventName);
  });
  return self;
};

/**
 * Track user visit to /containers page
 * Reports to:
 *   - mixpanel
 * @return this
 */
EventTracking.prototype.visitedContainersPage = function () {
  var self = this;
  var eventName = 'Visited containers page';

  self._mixpanel('track', eventName);
  return self;
};

/**
 * Track user clicks on an org on the orgSelect page
 * Reports to:
 *   - mixpanel
 *   - segment
 * @return this
 */
EventTracking.prototype.selectedOrg = function (org) {
  var self = this;
  var eventName = 'Org Selected';

  self._mixpanel('track', eventName, {
    org: org
  });
  self.analytics.ready(function () {
    self.analytics.track(eventName, {org: org});
  });
  return self;
};

/**
 * Track org click on /orgSelect page
 * Reports to:
 *   - segment
 * @return this
 */
EventTracking.prototype.waitingForInfrastructure = function (orgName) {
  var self = this;
  var eventName = 'Waiting for infrastrucuture';

  self.analytics.ready(function () {
    self.analytics.track(eventName, {org: orgName});
  });
  return self;
};

/**
 * Milestone 2: Select repository
 * Reports to:
 *   - mixpanel
 * @return this
 */
EventTracking.prototype.milestone2SelectTemplate = function () {
  var self = this;
  var eventName = 'Milestone 2: Select template';

  self._mixpanel('track', eventName);
  return self;
};

/**
 * Milestone 2: Verify repository tab
 * Reports to:
 *   - mixpanel
 * @return this
 */
EventTracking.prototype.milestone2VerifyRepositoryTab = function () {
  var self = this;
  var eventName = 'Milestone 2: Verify repository tab';

  self._mixpanel('track', eventName);
  return self;
};

/**
 * Milestone 2: Verify commands tab
 * Reports to:
 *   - mixpanel
 * @return this
 */
EventTracking.prototype.milestone2VerifyCommandsTab = function () {
  var self = this;
  var eventName = 'Milestone 2: Verify commands tab';

  self._mixpanel('track', eventName);
  return self;
};

/**
 * Milestone 2: Building
 * Reports to:
 *   - mixpanel
 * @return this
 */
EventTracking.prototype.milestone2Building = function () {
  var self = this;
  var eventName = 'Milestone 2: Building';

  self._mixpanel('track', eventName);
  return self;
};

/**
 * Milestone 2: Container popover
 * Reports to:
 *   - mixpanel
 * @return this
 */
EventTracking.prototype.milestone2BuildSuccess = function () {
  var self = this;
  var eventName = 'Milestone 2: Build success message (in modal)';

  self._mixpanel('track', eventName);
  return self;
};

/**
 * Milestone 3: Added branch
 * Reports to:
 *   - mixpanel
 * @return this
 */
EventTracking.prototype.milestone3AddedBranch = function () {
  var self = this;
  var eventName = 'Milestone 3: Added branch';

  self._mixpanel('track', eventName);
  return self;
};

/**
 * Milestone 4: Invited Runnabot
 * Reports to:
 *   - mixpanel
 * @return this
 */
EventTracking.prototype.invitedRunnabot = function () {
  var self = this;
  var eventName = 'Invited Runnabot';

  self._mixpanel('track', eventName);
  return self;
};

/**
 * Enabled auto-launch
 * Reports to:
 *   - mixpanel
 * @return this
 */
EventTracking.prototype.enabledAutoLaunch = function () {
  var self = this;
  var eventName = 'Enabled auto-launch';

  self._mixpanel('track', eventName);
  return self;
};
