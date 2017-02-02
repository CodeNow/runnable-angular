'use strict';

require('app')
  .controller('ControllerApp', ControllerApp);

function ControllerApp(
  $localStorage,
  $q,
  $rootScope,
  $scope,
  $state,
  $timeout,
  $window,
  activeAccount,
  ahaGuide,
  configAPIHost,
  configEnvironment,
  configLoginURL,
  currentOrg,
  debounce,
  demoFlowService,
  errs,
  featureFlags,
  fetchInstancesByPod,
  keypather,
  ModalService,
  orgs,
  pageName,
  patchOrgMetadata,
  primus,
  user
) {
  // Load ace after 10 seconds. Should improve user experience overall..
  this.activeAccount = activeAccount;
  this.user = user;
  var CA = this;
  CA.ahaGuide = ahaGuide;
  CA.currentOrg = currentOrg;
  CA.shouldShowTeamCTA = demoFlowService.shouldShowTeamCTA;

  fetchInstancesByPod()
    .then(function (instancesByPod) {
      CA.instancesByPod = instancesByPod;
    });

  CA.showDemoRepo = function () {
    return ahaGuide.isAddingFirstRepo() && !ahaGuide.hasConfirmedSetup() && ahaGuide.hasDemoRepo();
  };

  CA.demoAddOrg = function () {
    demoFlowService.endDemoFlow();
    $state.go('orgSelect', {
      reload: true
    });
  };

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

  $scope.$watch('dataApp.data.activeAccount', function (activeAccount) {
    if (user.socket) {
      user.socket.joinOrgRoom(activeAccount.oauthId());
    }
  });

  $rootScope.pageName = pageName;

  var w = angular.element($window);
  w.bind('resize', debounce(function () {
    $timeout(angular.noop);
  }, 33));

  $rootScope.featureFlags = featureFlags.flags;
  $rootScope.resetFeatureFlags = featureFlags.reset;
  this.featureFlagsChanged = featureFlags.changed;

  var orgStream = primus.createUserStream(currentOrg.github.attrs.id);

  orgStream.on('data', function(data) {
    var task = keypather.get(data, 'data.task');
    if (task) {
      $rootScope.$broadcast(task);
    }
  });

  $scope.$watch(function () {
    return errs.errors.length;
  }, function(n) {
    if (n) {
      dataApp.data.modalError.data.errors = errs.errors;
      dataApp.data.modalError.data.in = true;
    }
  });

  CA.showAhaNavPopover = false;
  $scope.$on('launchAhaNavPopover', function () {
    CA.showAhaNavPopover = !keypather.get(currentOrg, 'poppa.attrs.metadata.hasConfirmedSetup');
  });

  CA.showAhaConfirmation = function(event) {
    event.stopPropagation();
    event.preventDefault();
    CA.showAhaNavPopover = false;

    var confirmationPromise = $q.when(true);
    if (!ahaGuide.hasDemoRepo()) {
      confirmationPromise = ModalService.showModal({
        controller: 'ConfirmationModalController',
        controllerAs: 'CMC',
        templateUrl: 'confirmSetupView'
      })
        .then(function(modal) {
          return modal.close;
        });
    }
    confirmationPromise
      .then(function(confirmed) {
        if (confirmed) {
          return patchOrgMetadata(currentOrg.poppa.id(), {
            metadata: {
              hasConfirmedSetup: true
            }
          })
            .then(function(updatedOrg) {
              ahaGuide.updateCurrentOrg(updatedOrg);
              $state.go('base.instances', {userName: CA.activeAccount.oauthName()});
            });
        }
      })
      .catch(errs.handler);
  };

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

  if (currentOrg.isPaymentDue()) {
    // Determine if it's a trial end or just a normal payment due
    if (currentOrg.poppa.attrs.hasPaymentMethod) {
      ModalService.showModal({
        controller: 'ExpiredAccountController',
        controllerAs: 'EAC',
        templateUrl: 'paymentDueView',
        preventClose: true
      });
    } else {
      ModalService.showModal({
        controller: 'ExpiredAccountController',
        controllerAs: 'EAC',
        templateUrl: 'trialEndView',
        preventClose: true
      });
    }
  } else if (currentOrg.isPaused()) {
    return $state.go('paused');
  }

  $rootScope.canEditFeatureFlags = function () {
    return !!dataApp.data.allAccounts.find(function (account) {
      return account.oauthName() === 'CodeNow';
    });
  };

  CA.showTrialEndingNotification = function () {
    return currentOrg.poppa.isInTrial() &&
      currentOrg.poppa.trialDaysRemaining() <= 3 &&
      !currentOrg.poppa.attrs.hasPaymentMethod && !keypather.get($localStorage, 'hasDismissedTrialNotification.' + currentOrg.github.attrs.id);
  };

  CA.closeTrialEndingNotification = function () {
    keypather.set($localStorage, 'hasDismissedTrialNotification.' + currentOrg.github.attrs.id, true);
  };
}
