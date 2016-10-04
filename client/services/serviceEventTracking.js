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
  $q,
  $state,
  $stateParams,
  $window,
  assign,
  currentOrg,
  configEnvironment,
  fetchUser,
  fetchGrantedGithubOrgs,
  keypather,
  siftApiConfig
) {
  var ET = this;
  SIFT_API_KEY = siftApiConfig;

  if (configEnvironment === 'production') {
    INTERCOM_APP_ID = 'wqzm3rju'; // production ID
  } else {
    INTERCOM_APP_ID = 'xs5g95pd'; // test ID
  }
  _keypather = keypather;
  _$location = $location;

  ET.analytics = $window.analytics;
  ET._user = null;
  ET.$window = $window;

  /**
   * Extend per-event data with specific properties
   * to be sent w/ all events
   * @param {Object} data - data for given event to be extended
   * @return Object - extended event object
   */
  ET.extendEventData = function (data) {
    if (!ET._user) {
      $log.error('eventTracking.boot() must be invoked before reporting events');
    }
    // username owner if server page
    // name of server if server page
    // page event triggered from
    var baseData = {
      state: $state.$current.name,
      href: $window.location.href
    };
    if (angular.isFunction(keypather.get(ET._user, 'oauthName'))) {
      baseData.userName = ET._user.oauthName();
    }
    if ($stateParams.userName) {
      baseData.instanceOwner = $stateParams.userName;
    }
    if ($stateParams.instanceName) {
      baseData.instanceName = $stateParams.instanceName;
    }
    return assign(data, baseData);
  };

  var isModerating = !!$browser.cookies().isModerating;
  ET.Intercom = function () {
    if (ET.$window.Intercom && !isModerating) {
      ET.$window.Intercom.apply($window.Intercom, arguments);
    }
  };

  if (isModerating) {
    ET.$window.intercomSettings = {
      hide_default_launcher: true
    };
  }

  /**
   * Stub Segment when SDK not present
   * (development/staging environments)
   */
  if (!ET.analytics) {
    // stub segment (analytics) if not present
    ET.analytics = {
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
  ET._mixpanel = function () {
    if (!angular.isFunction(keypather.get($window, 'mixpanel.'+arguments[0]))) {
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

  /**
   * Intercom, Mixpanel, and Segment user identification
   * @throws Error
   * @param {Object} user - User Model instance
   * @return this
   */
  ET.boot = function (user, opts) {
    opts = opts || {};
    // if (ET._user) { return ET; }
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

      ET.analytics.ready(function () {
        ET.analytics.track('ViewContent', {
          action: 'LoggedIn'
        });
      });
    }

    ET._user = user;
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
    if (angular.isString(ET._mixpanel('get_distinct_id'))) {
      ET._mixpanel('alias', user.oauthId());
    } else {
      ET._mixpanel('identify', user.oauthId());
    }

    ET.Intercom('boot', data);
    var userJSON = user.toJSON();
    var firstName = '';
    var lastName = '';
    var displayName = _keypather.get(userJSON, 'accounts.github.displayName');
    if (displayName) {
      firstName = displayName.split(/ (.+)/)[0];
      lastName = displayName.split(/ (.+)/)[1];
    }
    var orgs = keypather.get(user, 'attrs.bigPoppaUser.organizations');
    var hasAnyOrgCompletedAha = orgs && orgs.reduce(function (prev, org) {
      if (prev) { return true; }
      if (!keypather.get(org, 'metadata.hasAha')) { return true; }
      return false;
    }, false);

    ET._mixpanel('people.set', {
      '$first_name': firstName,
      '$last_name': lastName,
      '$created': _keypather.get(userJSON, 'created'),
      '$email': _keypather.get(userJSON, 'email')
    });

    // Segment
    ET.analytics.ready(function () {
      ET.analytics.identify(data.name, {
        firstName: firstName,
        lastName: lastName,
        username: data.name,
        email: _keypather.get(userJSON, 'email'),
        createdAt: _keypather.get(userJSON, 'created'),
        avatar: _keypather.get(userJSON, 'gravatar')
      });
      ET.analytics.alias(user.oauthId());
      ET.analytics.alias(_keypather.get(userJSON, '_id'));
      if (opts.orgName) {
        ET.analytics.group(data.company.id, {
          name: data.company.name
        });
      }
    });
    return ET;
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
  ET.toggledCommit = function (data) {
    var eventName = 'toggled-commit';
    var eventData = ET.extendEventData({
      triggeredBuild: !!data.triggeredBuild,
      selectedCommit: data.acv
    });
    ET._mixpanel('track', eventName, eventData);
    ET.analytics.ready(function () {
      ET.analytics.track(eventName, eventData);
    });
    return ET;
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
  ET.triggeredBuild = function (cache) {
    var eventName = 'triggered-build';
    var eventData = ET.extendEventData({
      cache: cache
    });
    ET.Intercom('trackEvent', eventName, eventData);
    ET._mixpanel('track', eventName, eventData);
    ET.analytics.ready(function () {
      ET.analytics.track(eventName, eventData);
    });
    return ET;
  };

  /**
   * Record user visit to states
   * Reports to:
   *   - mixpanel
   *   - segment
   * @return this
   */
  ET.visitedState = function () {
    var eventName = 'visited-state';
    var eventData = ET.extendEventData({
      referral: _$location.search().ref || 'direct'
    });
    ET._mixpanel('track', eventName, eventData);
    ET.analytics.ready(function () {
      ET.analytics.track(eventName, eventData);
    });
    return ET;
  };

  /**
   * Intercom JS SDK API update method wrapper
   * Checks for & displays new messages from Intercom
   * @return this
   */
  ET.update = function () {
    ET.Intercom('update');
    return ET;
  };

  /**
   * Track clicks on the page
   * @param data
   * @returns {EventTracking}
   */
  ET.trackClicked = function (data) {

    ET._mixpanel('track', 'Click', data);
    ET.analytics.ready(function () {
      ET.analytics.track('Click', data);
    });
    return ET;
  };

  /**
   * Track creating repo containers
   * @param {String} orgName
   * @param {String} repoName
   * @returns {EventTracking}
   */
  ET.createdRepoContainer = function (org, repo) {
    if (ET._mixpanel) {
      ET._mixpanel('track', 'createRepoContainer', {
        org: org,
        repo: repo
      });
    }

    ET.analytics.ready(function () {
      ET.analytics.track('ViewContent', {
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
  ET.createdNonRepoContainer = function (containerName) {
    if (ET._mixpanel) {
      ET._mixpanel('track', 'createNonRepoContainer', {
        containerName: containerName
      });
    }

    ET.analytics.ready(function () {
      ET.analytics.track('ViewContent', {
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
  ET.visitedOrgSelectPage = function () {
    var eventName = 'Visited org-select page';

    ET._mixpanel('track', eventName);
    ET.analytics.ready(function () {
      ET.analytics.track(eventName);
    });
    return ET;
  };

  /**
   * Track user visit to /containers page
   * Reports to:
   *   - mixpanel
   * @return this
   */
  ET.visitedContainersPage = function () {
    var eventName = 'Visited containers page';

    ET._mixpanel('track', eventName);
    return ET;
  };

  /**
   * Track user clicks on an org on the orgSelect page
   * Reports to:
   *   - mixpanel
   *   - segment
   * @return this
   */
  ET.selectedOrg = function (org) {
    var eventName = 'Org Selected';

    ET._mixpanel('track', eventName, {
      org: org
    });
    ET.analytics.ready(function () {
      ET.analytics.track(eventName, {org: org});
    });
    return ET;
  };

  /**
   * Track org click on /orgSelect page
   * Reports to:
   *   - segment
   * @return this
   */
  ET.waitingForInfrastructure = function (orgName) {
    var eventName = 'Waiting for infrastrucuture';

    ET.analytics.ready(function () {
      ET.analytics.track(eventName, {org: orgName});
    });
    return ET;
  };

  /**
   * Milestone 2: Select repository
   * Reports to:
   *   - mixpanel
   * @return this
   */
  ET.milestone2SelectTemplate = function () {
    var eventName = 'Milestone 2: Select template';

    ET._mixpanel('track', eventName);
    return ET;
  };

  /**
   * Milestone 2: Verify repository tab
   * Reports to:
   *   - mixpanel
   * @return this
   */
  ET.milestone2VerifyRepositoryTab = function () {
    var eventName = 'Milestone 2: Verify repository tab';

    ET._mixpanel('track', eventName);
    return ET;
  };

  /**
   * Milestone 2: Verify commands tab
   * Reports to:
   *   - mixpanel
   * @return this
   */
  ET.milestone2VerifyCommandsTab = function () {
    var eventName = 'Milestone 2: Verify commands tab';

    ET._mixpanel('track', eventName);
    return ET;
  };

  /**
   * Milestone 2: Building
   * Reports to:
   *   - mixpanel
   * @return this
   */
  ET.milestone2Building = function () {
    var eventName = 'Milestone 2: Building';

    ET._mixpanel('track', eventName);
    return ET;
  };

  /**
   * Milestone 2: Container popover
   * Reports to:
   *   - mixpanel
   * @return this
   */
  ET.milestone2BuildSuccess = function () {
    var eventName = 'Milestone 2: Build success message (in modal)';

    ET._mixpanel('track', eventName);
    return ET;
  };

  /**
   * Milestone 3: Added branch
   * Reports to:
   *   - mixpanel
   * @return this
   */
  ET.milestone3AddedBranch = function () {
    var eventName = 'Milestone 3: Added branch';

    ET._mixpanel('track', eventName);
    return ET;
  };

  /**
   * Milestone 4: Invited Runnabot
   * Reports to:
   *   - mixpanel
   * @return this
   */
  ET.invitedRunnabot = function () {
    var eventName = 'Invited Runnabot';

    ET._mixpanel('track', eventName);
    return ET;
  };

  /**
   * Enabled auto-launch
   * Reports to:
   *   - mixpanel
   * @return this
   */
  ET.enabledAutoLaunch = function () {
    var eventName = 'Enabled auto-launch';
    ET._mixpanel('track', eventName);
    return ET;
  };

  ET.updateCurrentPersonProfile = function (currentStep) {
    return $q.all([
      fetchUser(),
      fetchGrantedGithubOrgs()
    ])
      .then(function (res) {
        var grantedOrgs = res[1];
        var userJSON = res[0].toJSON();
        var orgs = keypather.get(userJSON, 'bigPoppaUser.organizations');
        var hasAnyOrgCompletedAha = orgs && orgs.reduce(function (prev, org) {
          if (prev) { return true; }
          if (!keypather.get(org, 'metadata.hasAha')) { return true; }
          return false;
        }, false);

        ET._mixpanel('people.set', {
          'FurthestStep': currentStep,
          'CurrentOrg': keypather.get(currentOrg, 'poppa.name'),
          'NumberOfOrgsWithGrantedAccess': keypather.get(grantedOrgs, 'models.length'),
          'NumberOfOrgs': keypather.get(userJSON, 'bigPoppaUser.organizations.length'),
          'HasAnyOrgCompletedAha': hasAnyOrgCompletedAha
        });
      });
  };

  return ET;
}
