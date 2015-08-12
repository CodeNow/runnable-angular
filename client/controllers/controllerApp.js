'use strict';

require('app')
  .controller('ControllerApp', ControllerApp);


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
  fetchInstancesByPod,
  pageName,
  $localStorage,

  user,
  orgs,
  activeAccount
) {
  eventTracking.boot(user);


  this.activeAccount = activeAccount;
  this.user = user;
  var CA = this;

  fetchInstancesByPod()
    .then(function (instancesByPod) {
      CA.instancesByPod = instancesByPod;
    });

  var dataApp = $rootScope.dataApp = $scope.dataApp = {
    data: {
      user: user,
      orgs: orgs,
      allAccounts: [user].concat(orgs.models),
      instances: null,
      activeAccount: activeAccount,
      configAPIHost: configAPIHost,
      minimizeNav: false,
      loginURL: configLoginURL(),
      modalError: {
        data: {},
        actions: {
          close: function () {
            errs.clearErrors();
            dataApp.data.modalError.data.in = false;
          }
        }
      },
      // used in dev-info box
      configEnvironment: configEnvironment
    },
    actions: {},
    state: $state
  };

  if (user.socket) {
    user.socket.joinOrgRoom(activeAccount.oauthId());
  }

  $rootScope.pageName = pageName;

  var w = angular.element($window);
  w.bind('resize', debounce(function () {
    $timeout(angular.noop);
  }, 33));

  var defaultFeatureFlags = {
    additionalRepositories: false,
    advancedRepositories: true,
    buildCommandCache: true,
    cardStatus: false,
    debugMode: false,
    dockerfileTool: true,
    findAndReplace: true,
    fullScreen: false,  // toggles full screen
    fullScreenToggle: false,  // toggles the button that toggles full screen
    hostnameNotifications: false,
    hostnameTool: false,
    imAfraidOfTheDark: false, // toggles theme
    internalDebugging: false,
    nameContainer: false,
    multilineFnR: false,
    navListFilter: false,
    newVerificationFlow: false,
    packagesField: true,
    renameContainer: false,
    saveToolbar: false,
    sshKeys: true,
    themeToggle: false, // toggles the button that toggles theme
    updatedBuildLogs: false
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
    $rootScope.$broadcast('app-document-click', event.target);
  };

  dataApp.documentKeydownEventHandler = function(e) {
    if (e.keyCode === 27) {
      $rootScope.$broadcast('app-document-click');
      $rootScope.$broadcast('close-modal');
    }
  };
}
