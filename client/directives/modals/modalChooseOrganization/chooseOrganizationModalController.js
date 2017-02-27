'use strict';

require('app')
  .controller('ChooseOrganizationModalController', ChooseOrganizationModalController);
function ChooseOrganizationModalController(
  $interval,
  $q,
  $rootScope,
  $scope,
  $state,
  ahaGuide,
  waitForWhitelistExist,
  configEnvironment,
  createNewSandboxForUserService,
  currentOrg,
  customWindowService,
  errs,
  eventTracking,
  featureFlags,
  fetchWhitelistForDockCreated,
  github,
  keypather,
  loading,
  promisify,

  // Injected
  close,
  grantedOrgs,
  user,
  whitelistedOrgs
) {
  var COMC = this;
  COMC.close = close;
  COMC.user = user;
  loading.reset('chooseOrg');
  loading.reset('waitingForDockCreated');
  $rootScope.featureFlags = featureFlags.flags;
  COMC.allAccounts = grantedOrgs;
  COMC.whitelistedOrgs = whitelistedOrgs;
  var nonPersonalWhitelistedOrgs = whitelistedOrgs.filter(function (org) {
    return !org.attrs.isPersonalAccount;
  });
  COMC.personalAccountOnly = grantedOrgs.models.length === 0 && nonPersonalWhitelistedOrgs.length === 0;

  COMC.defaultBasePanel = 'orgSelection';

  COMC.isInDemoFlow = false;

  $scope.$broadcast('go-to-panel', COMC.defaultBasePanel, 'immediate');

  COMC.cancelPollingForWhitelisted = function () {
    if (COMC.pollForWhitelistPromise) {
      $interval.cancel(COMC.pollForWhitelistPromise);
    }
  };

  COMC.grantAccess = function (isDemo) {
    var loadingString = 'grantAccess';
    if (isDemo) {
      loadingString = 'grantAccessDemo';
    }

    var connectionUrl = '/githubAuth';

    if (isDemo) {
      connectionUrl = connectionUrl + '?isDemo=true';
    }
    var customWindow = customWindowService(connectionUrl, {
      width: 1020, // match github minimum width
      height: 730
    });
    loading.reset(loadingString);
    loading(loadingString, true);
    COMC.cancelPollingForWhitelisted();

    return $q(function (resolve) {
      var originalOrgList = grantedOrgs.models.map(function (org) {
        return org.oauthName().toLowerCase();
      });
      COMC.newOrgList = [];
      COMC.pollForWhitelistPromise = $interval(function () {
        promisify(grantedOrgs, 'fetch')({'_bustCache': Math.random()})
          .then(function (orgs) {
            COMC.newOrgList = orgs.models.filter(function (org) {
              return !originalOrgList.includes(org.oauthName().toLowerCase());
            });
            if (COMC.newOrgList.length) {
              COMC.showGrantAccess = false;
              loading(loadingString, false);
              resolve();
              COMC.cancelPollingForWhitelisted();
              customWindow.close();
              if (COMC.newOrgList.length === 1) {
                COMC.actions.selectAccount(COMC.newOrgList[0].oauthName());
              } else if (COMC.newOrgList.length > 1) {
                $scope.$broadcast('go-to-panel', 'orgSelection');
              }
            }
          });
      }, 1000 * 5);
    });
  };

  COMC.creatingOrg = false;

  COMC.createOrg = function () {
    COMC.creatingOrg = true;
    customWindowService('https://github.com/organizations/new');
  };

  $scope.$on('$destroy', function () {
    COMC.cancelPollingForWhitelisted();
  });


  // otherwise the user can clear away the model
  // this will be re-added when they transition to something else
  keypather.set($rootScope, 'dataApp.documentKeydownEventHandler', null);

  COMC.actions = {
    trackDemoVideo: eventTracking.trackDemoVideo,
    selectAccount: function (selectedOrgName) {
      // Update number of orgs for user
      eventTracking.updateCurrentPersonProfile(ahaGuide.getCurrentStep(), selectedOrgName);
      var org = whitelistedOrgs.find(function (org) {
        return selectedOrgName.toLowerCase() === org.attrs.name.toLowerCase();
      });
      return $q.when(org)
        .then(function (foundWhitelistedOrg) {
          if (foundWhitelistedOrg) {
            return foundWhitelistedOrg;
          }
          return createNewSandboxForUserService(selectedOrgName)
            .then(function () {
              // Check is async and we need this in order to assert
              // org has already been added
              return waitForWhitelistExist(selectedOrgName);
            });
        })
        .then(function (orgs) {
          close();
          $state.go('base.instances', {
            userName: selectedOrgName
          }, { reload: true });
        })
        .catch(errs.handler);
    }
  };

  COMC.isChoosingOrg = ahaGuide.isChoosingOrg;

  // Since this is a root route, it needs this stuff
  $scope.$watch(function () {
    return errs.errors.length;
  }, function (n) {
    if (n) {
      keypather.set($rootScope, 'dataApp.data.modalError.data.errors', errs.errors);
      keypather.set($rootScope, 'dataApp.data.modalError.data.in', true);
    }
  });

  keypather.set($rootScope, 'dataApp.data.modalError.actions', {
    close: function () {
      errs.clearErrors();
      keypather.set($rootScope, 'dataApp.data.modalError.data.in', false);
    }
  });
}
