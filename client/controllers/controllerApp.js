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

  loading('main', true);
  var thisUser;
  var dataApp = $rootScope.dataApp = $scope.dataApp = {
    data: {},
    actions: {},
    state: {}
  };
  $rootScope.pageName = pageName;

  var w = angular.element($window);
  w.bind('resize', debounce(function () {
    $timeout(angular.noop);
  }, 33));

  // used in dev-info box
  dataApp.data.configEnvironment = configEnvironment;
  $rootScope.featureFlags = {
    advancedRepositories: true,
    cardStatus: configEnvironment === 'development',
    debugMode: configEnvironment === 'development',
    dockerfileTool: configEnvironment === 'development',
    findAndReplace: true,
    hostnameTool: configEnvironment === 'development',
    hostnameNotifications: configEnvironment === 'development',
    imAfraidOfTheDark: configEnvironment === 'development',
    navListFilter: configEnvironment === 'development',
    saveToolbar: configEnvironment === 'development'
  };

  if($localStorage.featureFlags){
    Object.keys($localStorage.featureFlags).forEach(function (flag) {
      $rootScope.featureFlags[flag] = $localStorage.featureFlags[flag];
    });
  }

  dataApp.data.configAPIHost = configAPIHost;
  dataApp.data.minimizeNav = false;
  dataApp.data.loginURL = configLoginURL();

  dataApp.state = $state;

  dataApp.data.modalError = {
    data: {},
    actions: {
      close: function () {
        errs.clearErrors();
        dataApp.data.modalError.data.in = false;
      }
    }
  };

  var fetchUserPromise = fetchUser()
    .then(function (results) {
      thisUser = results;
      dataApp.data.user = results;
      // Intercom && Mixpanel
      eventTracking.boot(thisUser);
      return fetchOrgs();
    })
    .then(function (orgs) {
      dataApp.data.orgs = orgs;
      dataApp.data.allAccounts = [dataApp.data.user].concat(orgs.models);
    })
    .catch(errs.handler);

  function setActiveAccount(accountName) {
    if (accountName) {
      var unwatch = $scope.$watch('dataApp.data.orgs', function(n) {
        if (n) {
          unwatch();
          dataApp.data.instances = null;
          var accounts = [thisUser].concat(n.models);
          dataApp.data.activeAccount = accounts.find(function (org) {
            return (keypather.get(org, 'oauthName().toLowerCase()') === accountName.toLowerCase());
          });
          if (dataApp.data.user.socket) {
            dataApp.data.user.socket.joinOrgRoom(dataApp.data.activeAccount.oauthId());
          }

          if (!dataApp.data.activeAccount) {
            dataApp.data.activeAccount = thisUser;
          }
          $rootScope.$broadcast('INSTANCE_LIST_FETCH', dataApp.data.activeAccount.oauthName());
        }
      });
    }
  }
  $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams, error) {
    if (!keypather.get(dataApp, 'data.activeAccount.oauthName()') ||
        toParams.userName !== dataApp.data.activeAccount.oauthName()) {
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
      dataApp.data.modalError.data.errors = errs.errors;
      dataApp.data.modalError.data.in = true;
    }
  });

  /**
   * broadcast to child scopes when click event propagates up
   * to top level controller scope.
   * Used to detect click events outside of any child element scope
   */
  dataApp.documentClickEventHandler = function (event) {
    $scope.$broadcast('app-document-click', event.target);
  };

  dataApp.documentKeydownEventHandler = function(e) {
    if (e.keyCode === 27) {
      $rootScope.$broadcast('app-document-click');
      $rootScope.$broadcast('close-modal');
    }
  };
}
