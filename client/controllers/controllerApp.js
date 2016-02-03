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
  configAPISockHost,
  configEnvironment,
  configLoginURL,
  debounce,
  errs,
  eventTracking,
  fetchInstancesByPod,
  pageName,
  featureFlags,
  $ocLazyLoad,
  ModalService,
  keypather,

  user,
  orgs,
  activeAccount
) {
  // Load ace after 5 seconds. Should improve user experience overall..
  $timeout(function () {
    $ocLazyLoad.load('ui.ace');
  }, 10000);

  this.activeAccount = activeAccount;
  this.user = user;
  var CA = this;

  fetchInstancesByPod()
    .then(function (instancesByPod) {
      CA.instancesByPod = instancesByPod;
    });

  $rootScope.ModalService = ModalService;

  var allAccounts = orgs.models;
  if (user.isManuallyWhitelisted) {
    allAccounts = [user].concat(orgs.models);
  }

  var dataApp = $rootScope.dataApp = $scope.dataApp = {
    data: {
      user: user,
      orgs: orgs,
      allAccounts: allAccounts,
      instances: null,
      activeAccount: activeAccount,
      configAPIHost: configAPIHost,
      configAPISockHost: configAPISockHost,
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

  $rootScope.featureFlags = featureFlags.flags;
  $rootScope.resetFeatureFlags = featureFlags.reset;
  this.featureFlagsChanged = featureFlags.changed;

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
      var lastModalObj = ModalService.modalLayers[ModalService.modalLayers.length - 1];
      if (lastModalObj) {
        var close = keypather.get(lastModalObj, 'modal.controller.actions.close') || lastModalObj.close;
        close();
      }
    }
  };

  $rootScope.canEditFeatureFlags = function () {
    return !!dataApp.data.allAccounts.find(function (account) {
      return account.oauthName() === 'CodeNow';
    });
  };


}
