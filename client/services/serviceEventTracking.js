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
  fetchUserUnCached,
  fetchGrantedGithubOrgs,
  keypather,
  siftApiConfig
) {
  var ETS = this;
  var SIFT_API_KEY = siftApiConfig;
  var INTERCOM_APP_ID;

  if (configEnvironment === 'production') {
    INTERCOM_APP_ID = 'wqzm3rju'; // production ID
  } else {
    INTERCOM_APP_ID = 'xs5g95pd'; // test ID
  }

  ETS.analytics = $window.analytics;
  ETS._user = null;

  /**
   * Extend per-event data with specific properties
   * to be sent w/ all events
   * @param {Object} data - data for given event to be extended
   * @return Object - extended event object
   */
  ETS.extendEventData = function (data) {
    if (!ETS._user) {
      $log.error('eventTracking.boot() must be invoked before reporting events');
    }
    // username owner if server page
    // name of server if server page
    // page event triggered from
    var baseData = {
      state: $state.$current.name,
      href: $window.location.href
    };
    if (angular.isFunction(keypather.get(ETS._user, 'oauthName'))) {
      baseData.userName = ETS._user.oauthName();
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
  ETS.Intercom = function () {
    if ($window.Intercom && !isModerating) {
      $window.Intercom.apply($window.Intercom, arguments);
    }
  };

  if (isModerating) {
    $window.intercomSettings = {
      hide_default_launcher: true
    };
  }

  /**
   * Stub Segment when SDK not present
   * (development/staging environments)
   */
  if (!ETS.analytics) {
    // stub segment (analytics) if not present
    ETS.analytics = {
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
  ETS._mixpanel = function () {
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
  ETS.boot = function (user, opts) {
    opts = opts || {};
    // if (ETS._user) { return ETS; }
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

      ETS.analytics.ready(function () {
        ETS.analytics.track('ViewContent', {
          action: 'LoggedIn'
        });
      });
    }

    ETS._user = user;
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
    if (angular.isString(ETS._mixpanel('get_distinct_id'))) {
      ETS._mixpanel('alias', user.oauthId());
    } else {
      ETS._mixpanel('identify', user.oauthId());
    }

    ETS.Intercom('boot', data);
    var userJSON = user.toJSON();
    var firstName = '';
    var lastName = '';
    var displayName = keypather.get(userJSON, 'accounts.github.displayName');
    if (displayName) {
      firstName = displayName.split(/ (.+)/)[0];
      lastName = displayName.split(/ (.+)/)[1];
    }

    ETS._mixpanel('people.set', {
      '$first_name': firstName,
      '$last_name': lastName,
      '$created': keypather.get(userJSON, 'created'),
      '$email': keypather.get(userJSON, 'email')
    });

    // Segment
    ETS.analytics.ready(function () {
      ETS.analytics.identify(data.name, {
        firstName: firstName,
        lastName: lastName,
        username: data.name,
        displayName: displayName || data.name,
        email: keypather.get(userJSON, 'email'),
        createdAt: keypather.get(userJSON, 'created'),
        avatar: keypather.get(userJSON, 'gravatar')
      });
      ETS.analytics.alias(user.oauthId());
      ETS.analytics.alias(keypather.get(userJSON, '_id'));
      if (opts.orgName) {
        ETS.analytics.group(data.company.id, {
          name: data.company.name
        });
      }
    });
    return ETS;
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
  ETS.toggledCommit = function (data) {
    var eventName = 'toggled-commit';
    var eventData = ETS.extendEventData({
      triggeredBuild: !!data.triggeredBuild,
      selectedCommit: data.acv
    });
    ETS._mixpanel('track', eventName, eventData);
    ETS.analytics.ready(function () {
      ETS.analytics.track(eventName, eventData);
    });
    return ETS;
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
  ETS.triggeredBuild = function (cache) {
    var eventName = 'triggered-build';
    var eventData = ETS.extendEventData({
      cache: cache
    });
    ETS.Intercom('trackEvent', eventName, eventData);
    ETS._mixpanel('track', eventName, eventData);
    ETS.analytics.ready(function () {
      ETS.analytics.track(eventName, eventData);
    });
    return ETS;
  };

  /**
   * Record user visit to states
   * Reports to:
   *   - mixpanel
   *   - segment
   * @return this
   */
  ETS.visitedState = function () {
    var eventName = 'visited-state';
    var eventData = ETS.extendEventData({
      referral: $location.search().ref || 'direct'
    });
    ETS._mixpanel('track', eventName, eventData);
    ETS.analytics.ready(function () {
      ETS.analytics.track(eventName, eventData);
    });
    return ETS;
  };

  /**
   * Intercom JS SDK API update method wrapper
   * Checks for & displays new messages from Intercom
   * @return this
   */
  ETS.update = function () {
    ETS.Intercom('update');
    return ETS;
  };

  /**
   * Track clicks on the page
   * @param data
   * @returns {EventTracking}
   */
  ETS.trackClicked = function (data) {

    ETS._mixpanel('track', 'Click', data);
    ETS.analytics.ready(function () {
      ETS.analytics.track('Click', data);
    });
    return ETS;
  };

  /**
   * Track creating repo containers
   * @param {String} orgName
   * @param {String} repoName
   * @returns {EventTracking}
   */
  ETS.createdRepoContainer = function (org, repo) {
    if (ETS._mixpanel) {
      ETS._mixpanel('track', 'createRepoContainer', {
        org: org,
        repo: repo
      });
    }

    ETS.analytics.ready(function () {
      ETS.analytics.track('ViewContent', {
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
  ETS.createdNonRepoContainer = function (containerName) {
    if (ETS._mixpanel) {
      ETS._mixpanel('track', 'createNonRepoContainer', {
        containerName: containerName
      });
    }

    ETS.analytics.ready(function () {
      ETS.analytics.track('ViewContent', {
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
  ETS.visitedOrgSelectPage = function () {
    var eventName = 'Visited org-select page';

    ETS._mixpanel('track', eventName);
    ETS.analytics.ready(function () {
      ETS.analytics.track(eventName);
    });
    return ETS;
  };

  /**
   * Track user visit to /orgname/configure page
   * Reports to:
   *   - mixpanel
   * @return this
   */
  ETS.visitedConfigurePage = function () {
    var eventName = 'Visited configure page';

    ETS._mixpanel('track', eventName);
    return ETS;
  };

  /**
   * Track user visit to /containers page
   * Reports to:
   *   - mixpanel
   * @return this
   */
  ETS.visitedContainersPage = function () {
    var eventName = 'Visited containers page';

    ETS._mixpanel('track', eventName);
    return ETS;
  };

  /**
   * Track user clicks on an org on the orgSelect page
   * Reports to:
   *   - mixpanel
   *   - segment
   * @return this
   */
  ETS.selectedOrg = function (org) {
    var eventName = 'Org Selected';

    ETS._mixpanel('track', eventName, {
      org: org
    });
    ETS.analytics.ready(function () {
      ETS.analytics.track(eventName, {org: org});
    });
    return ETS;
  };

  /**
   * Track org click on /orgSelect page
   * Reports to:
   *   - segment
   * @return this
   */
  ETS.waitingForInfrastructure = function (orgName) {
    var eventName = 'Waiting for infrastrucuture';

    ETS.analytics.ready(function () {
      ETS.analytics.track(eventName, {org: orgName});
    });
    return ETS;
  };

  /**
   * Milestone 1: GitHub Primer
   * Reports to:
   *   - mixpanel
   * @return this
   */
  ETS.trackPrimer = function () {
    var eventName = 'Demo: Advanced to GitHub from primer step';

    ETS._mixpanel('track', eventName);
    return ETS;
  };

  /**
   * Milestone 2: Select repository
   * Reports to:
   *   - mixpanel
   * @return this
   */
  ETS.milestone2SelectTemplate = function () {
    var eventName = 'Milestone 2: Select service';

    ETS._mixpanel('track', eventName);
    return ETS;
  };

  /**
   * Milestone 2: Verify repository tab
   * Reports to:
   *   - mixpanel
   * @return this
   */
  ETS.milestone2VerifyRepositoryTab = function () {
    var eventName = 'Milestone 2: Verify repository tab';

    ETS._mixpanel('track', eventName);
    return ETS;
  };

  /**
   * Milestone 2: Verify commands tab
   * Reports to:
   *   - mixpanel
   * @return this
   */
  ETS.milestone2VerifyCommandsTab = function () {
    var eventName = 'Milestone 2: Verify commands tab';

    ETS._mixpanel('track', eventName);
    return ETS;
  };

  /**
   * Milestone 2: Building
   * Reports to:
   *   - mixpanel
   * @return this
   */
  ETS.milestone2Building = function () {
    var eventName = 'Milestone 2: Building';

    ETS._mixpanel('track', eventName);
    return ETS;
  };

  /**
   * Milestone 2: Container popover
   * Reports to:
   *   - mixpanel
   * @return this
   */
  ETS.milestone2BuildSuccess = function () {
    var eventName = 'Milestone 2: Build success message (in modal)';

    ETS._mixpanel('track', eventName);
    return ETS;
  };

  /**
   * Milestone 3: Added branch
   * Reports to:
   *   - mixpanel
   * @return this
   */
  ETS.milestone3AddedBranch = function () {
    var eventName = 'Milestone 3: Added branch';

    ETS._mixpanel('track', eventName);
    return ETS;
  };

  /**
   * Added Branch
   * Reports to:
   *  - Mixpanel
   * @returns this
   */
  ETS.hasAddedBranch = function () {
    var eventName = 'Added branch';

    ETS._mixpanel('track', eventName);
    return ETS;
  }

  /**
   * Milestone 4: Invited Runnabot
   * Reports to:
   *   - mixpanel
   * @return this
   */
  ETS.invitedRunnabot = function () {
    var eventName = 'Invited Runnabot';

    ETS._mixpanel('track', eventName);
    return ETS;
  };

  /**
   * Enabled auto-launch
   * Reports to:
   *   - mixpanel
   * @return this
   */
  ETS.enabledAutoLaunch = function () {
    var eventName = 'Enabled auto-launch';
    ETS._mixpanel('track', eventName);
    return ETS;
  };

  /**
   * Spun up infrastructure
   * Reports to:
   *   - mixpanel
   * @return this
   */
  ETS.spunUpInfrastructure = function () {
    var eventName = 'Spun up infrastructure';
    ETS._mixpanel('track', eventName);
    return ETS;
  };

  /**
   * Clicked ‘Change Team’
   * Reports to:
   *   - mixpanel
   * @return this
   */
  ETS.clickedChangeTeam = function () {
    var eventName = 'Clicked ‘Change Team’';
    ETS._mixpanel('track', eventName);
    return ETS;
  };

  /**
   * Opened Container URL
   * Reports to:
   *   - mixpanel
   * @return this
   */
  ETS.openedContainerUrl = function () {
    var eventName = 'Opened Container URL';
    ETS._mixpanel('track', eventName);
    return ETS;
  };

  ETS.updateCurrentPersonProfile = function (currentStep, orgNameInOrgSelect) {
    return $q.all([
      fetchUserUnCached(),
      fetchGrantedGithubOrgs()
    ])
      .then(function (res) {
        var grantedOrgs = res[1];
        var userJSON = res[0].toJSON();
        var orgs = keypather.get(userJSON, 'bigPoppaUser.organizations');
        var hasAnyOrgCompletedAha = !!orgs && orgs.some(function (org) {
          return !keypather.get(org, 'metadata.hasAha');
        });
        var bigPoppaUserId = keypather.get(userJSON, 'bigPoppaUser.id');
        var organizations = keypather.get(userJSON, 'bigPoppaUser.organizations');
        var orgsWhereUserIsCreator = Array.isArray(organizations) && organizations.filter(function (org) {
          return org.creator === bigPoppaUserId;
        });
        var creator = keypather.get(currentOrg, 'poppa.attrs.creator');
        var numberOfOrgs = keypather.get(organizations, 'length') || 0;
        var isCreatorOfCurrengOrg = bigPoppaUserId === creator;
        var isCreatorOfWaitingOrg = !!orgsWhereUserIsCreator.find(function (org) {
          return org.name === orgNameInOrgSelect;
        });
        var updates = {
          'bigPoppaId': bigPoppaUserId,
          'userName': keypather.get(userJSON, 'accounts.github.username'),
          'email': keypather.get(userJSON, 'email'),
          'FurthestStep': currentStep,
          'CurrentOrg': keypather.get(currentOrg, 'poppa.attrs.name'),
          'IsCreatorOfCurrentOrg': isCreatorOfCurrengOrg,
          'IsCreatorOfWaitingOrg': isCreatorOfWaitingOrg,
          'IsFirstUser': numberOfOrgs === 0 || isCreatorOfCurrengOrg || isCreatorOfWaitingOrg,
          'IsWaitingForOrg': !!orgNameInOrgSelect,
          'NumberOfOrgsWithGrantedAccess': keypather.get(grantedOrgs, 'models.length'),
          'NumberOfOrgs': numberOfOrgs,
          'NumberOfOrgsWhereCreator': keypather.get(orgsWhereUserIsCreator, 'length') || 0,
          'HasAnyOrgCompletedAha': hasAnyOrgCompletedAha
        };
        ETS._mixpanel('people.set', updates);
      });
  };

  return ETS;
}
