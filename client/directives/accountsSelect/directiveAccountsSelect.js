'use strict';

require('app')
  .directive('accountsSelect', accountsSelect);
/**
 * This directive is in charge of displaying the active account, and modifies the activeAccount
 * on the scope, which then propigates down the parent's scope.  It doesn't fetch anything, since
 * the parent fetches both the user and their orgs.
 * @ngInject
 */
function accountsSelect (
  $rootScope,
  $state,
  $timeout,
  configEnvironment,
  errs,
  keypather,
  ModalService,
  promisify,
  currentOrg
) {
  return {
    restrict: 'A',
    templateUrl: 'viewAccountsSelect',
    scope: {
      data: '='
    },
    link: function ($scope) {

      $scope.$on('changed-animated-panel', function (evt, panelName) {
        $scope.data.currentPanelName = panelName;
      });

      $scope.popoverAccountMenu = {
        actions: {
          getHeight: function (view) {
            // if no containers '143px'
            if ($rootScope.featureFlags.isolationSetUp && view === 1) {
              return '179px'; // when isolation is on and setup
            } else if (view === 1) {
              return '187px'; // when isolation is on and not setup
            } else if (view === 2) {
              return $scope.data.allAccounts.length * 36 + 44 + 'px'; // when viewing list of organizations
            }
          },
          logout: function () {
            promisify($scope.data.user, 'logout')().then(function () {
              window.location = '/';
            }).catch(errs.handler);
          },
          openSettingsModal: function (tabName) {
            $rootScope.$broadcast('close-popovers');
            ModalService.showModal({
              controller: 'SettingsModalController',
              controllerAs: 'SEMC',
              templateUrl: 'settingsModalView',
              inputs: {
                tab: tabName,
                subTab: ''
              }
            });
          },
          selectActiveAccount: function (userOrOrg) {
            var username = userOrOrg.oauthName();
            $rootScope.$broadcast('close-popovers');
            $timeout(function () {
              $state.go('base.instances', {
                userName: username
              }, {reload: true}).then(function () {
                $scope.data.activeAccount = userOrOrg;
                $scope.$emit('INSTANCE_LIST_FETCH', username);
              });
            });
          }
        },
        data: $scope.data,
        state: {
          active: false
        }
      };

      keypather.set($scope, 'popoverAccountMenu.data.dataModalIntegrations', $scope.data);
      keypather.set($scope, 'popoverAccountMenu.data.activeAccount', $scope.data.activeAccount);

      if (configEnvironment !== 'production') {
        keypather.set($scope, 'popoverAccountMenu.data.inDev', true);
      }
      $scope.$watch('data.activeAccount', function (account) {
        if (!account) { return; }
        keypather.set($scope, 'popoverAccountMenu.data.activeAccount', account);
        keypather.set($scope, 'popoverAccountMenu.data.currentOrg', currentOrg);
        keypather.set($scope, 'popoverAccountMenu.data.orgs', $scope.data.orgs);
        keypather.set($scope, 'popoverAccountMenu.data.user', $scope.data.user);

        // Integrations modal
        if ($scope.data.user.oauthName() === $state.params.userName) {
          $scope.popoverAccountMenu.data.showIntegrations = false;
        } else {
          $scope.popoverAccountMenu.data.showIntegrations = true;
        }
      });

      $scope.getBadgeCount = function () {
        if (!$rootScope.featureFlags.billing) {
          return '';
        }
        if (currentOrg.poppa.isInTrial() && !currentOrg.poppa.attrs.hasPaymentMethod) {
          return currentOrg.poppa.trialDaysRemaining();
        }
        return '';
      };

      $scope.getClasses = function () {
        if (!$rootScope.featureFlags.billing) {
          return {};
        }
        return {
          badge: currentOrg.poppa.isInTrial() && !currentOrg.poppa.attrs.hasPaymentMethod,
          'badge-orange': currentOrg.poppa.isInTrial() && !currentOrg.poppa.attrs.hasPaymentMethod
        };
      };
    }
  };
}
