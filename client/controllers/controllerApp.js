'use strict';

require('app')
  .controller('ControllerApp', ControllerApp);
/**
 * ControllerApp
 * @constructor
 * @export
 * @ngInject
 */
function ControllerApp(
  $rootScope,
  $scope,
  $state,
  $timeout,
  $window,
  configAPIHost,
  configEnvironment,
  configLoginURL,
  debounce,
  errs,
  eventTracking,
  fetchOrgs,
  fetchUser,
  keypather,
  pageName,
  loading,
  $localStorage
) {
  var CA = this;
  CA.data = {};
  CA.actions = {};
  CA.state = $state;

  loading('main', true);
  var thisUser;
  $rootScope.dataApp = CA;
  $rootScope.pageName = pageName;

  var w = angular.element($window);
  w.bind('resize', debounce(function () {
    $timeout(angular.noop);
  }, 33));

  // used in dev-info box
  CA.data.configEnvironment = configEnvironment;

  var defaultFeatureFlags = {
    advancedRepositories: true,
    buildCommandCache: true,
    cardStatus: false,
    debugMode: false,
    dockerfileTool: false,
    findAndReplace: true,
    fullScreen: false,  // toggles full screen
    fullScreenToggle: false,  // toggles the button that toggles full screen
    hostnameTool: false,
    hostnameNotifications: false,
    imAfraidOfTheDark: false, // toggles theme
    multilineFnR: false,
    navListFilter: false,
    packagesField: true,
    saveToolbar: false,
    themeToggle: false // toggles the button that toggles theme
  };
  $rootScope.featureFlags = {};
  $rootScope.resetFeatureFlags = function () {
    Object.keys(defaultFeatureFlags).forEach(function (key) {
      $rootScope.featureFlags[key] = defaultFeatureFlags[key];
    });
  };
  $rootScope.resetFeatureFlags();

  if($localStorage.featureFlags){
    Object.keys($localStorage.featureFlags).forEach(function (flag) {
      $rootScope.featureFlags[flag] = $localStorage.featureFlags[flag];
    });
  }

  CA.data.configAPIHost = configAPIHost;
  CA.data.minimizeNav = false;
  CA.data.loginURL = configLoginURL();

  CA.data.modalError = {
    data: {},
    actions: {
      close: function () {
        errs.clearErrors();
        CA.data.modalError.data.in = false;
      }
    }
  };

  var fetchUserPromise = fetchUser()
    .then(function (results) {
      thisUser = results;
      CA.data.user = results;
      // Intercom && Mixpanel
      eventTracking.boot(thisUser);
      return fetchOrgs();
    })
    .then(function (orgs) {
      CA.data.orgs = orgs;
      CA.data.allAccounts = [CA.data.user].concat(orgs.models);
    })
    .catch(errs.handler);

  function setActiveAccount(accountName) {
    if (accountName) {
      var unwatch = $scope.$watch('CA.data.orgs', function(n) {
        if (n) {
          unwatch();
          CA.data.instances = null;
          var accounts = [thisUser].concat(n.models);
          CA.data.activeAccount = accounts.find(function (org) {
            return (keypather.get(org, 'oauthName().toLowerCase()') === accountName.toLowerCase());
          });
          if (CA.data.user.socket) {
            CA.data.user.socket.joinOrgRoom(CA.data.activeAccount.oauthId());
          }

          if (!CA.data.activeAccount) {
            CA.data.activeAccount = thisUser;
          }
          $rootScope.$broadcast('INSTANCE_LIST_FETCH', CA.data.activeAccount.oauthName());
        }
      });
    }
  }
  $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams, error) {
    if (!keypather.get(CA, 'data.activeAccount.oauthName()') ||
        toParams.userName !== CA.data.activeAccount.oauthName()) {
      setActiveAccount(toParams.userName);
    }
    // We need to make sure the eventTracking.boot was called before this, otherwise intercom will
    // fail to show
    fetchUserPromise
      .then(function () {
        eventTracking.update();
      });
    loading('main', false);
  });

  $scope.$watch(function () {
    return errs.errors.length;
  }, function(n) {
    if (n) {
      CA.data.modalError.data.errors = errs.errors;
      CA.data.modalError.data.in = true;
    }
  });

  /**
   * broadcast to child scopes when click event propagates up
   * to top level controller scope.
   * Used to detect click events outside of any child element scope
   */
  CA.documentClickEventHandler = function (event) {
    $scope.$broadcast('app-document-click', event.target);
  };

  CA.documentKeydownEventHandler = function(e) {
    if (e.keyCode === 27) {
      $rootScope.$broadcast('app-document-click');
      $rootScope.$broadcast('close-modal');
    }
  };
}
