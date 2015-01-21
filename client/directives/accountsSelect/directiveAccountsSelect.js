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
  configLogoutURL,
  errs,
  $state,
  $rootScope
) {
  return {
    restrict: 'A',
    templateUrl: 'viewAccountsSelect',
    scope: {
      data: '='
    },
    link: function ($scope, elem, attrs) {

      $scope.popoverAccountMenu = {
        actions: {
          actionsModalIntegrations: {}
        },
        data: $scope.data
      };
      $scope.popoverAccountMenu.data.dataModalIntegrations = $scope.data;
      $scope.popoverAccountMenu.data.logoutURL = configLogoutURL();

      $scope.popoverAccountMenu.actions.selectActiveAccount = function (userOrOrg) {
        $scope.popoverAccountMenu.data.show = false;
        var username = userOrOrg.oauthName();
        $scope.data.activeAccount = userOrOrg;
        $scope.data.instances = null;
        $scope.$emit('INSTANCE_LIST_FETCH', username);
        $state.go('^.home', {
          userName: username
        });
      };

      var mActions = $scope.popoverAccountMenu.actions.actionsModalIntegrations;
      var mData = $scope.popoverAccountMenu.data.dataModalIntegrations;

      var unwatch = $scope.$watch('popoverAccountMenu.data.dataModalIntegrations.user', function(n) {
        if (n) {
          mActions.setActive(n);
          unwatch();
        }
      });

      mActions.closePopover = function() {
        $scope.popoverAccountMenu.data.show = false;
      };
      mActions.setActive = function(account) {
        mData.modalActiveAccount = account;
        mData.settings = {};
        $scope.data.user.fetchSettings({
          githubUsername: account.oauthName()
        }, function (err, settings) {
          if (err) { return errs.handler(err); }
          mData.settings = settings[0];
        });
      };
      mActions.saveSlack = function () {
        if (!mData.settings) { return; }
        $scope.data.user.newSetting(mData.settings._id)
        .update({
          json: {
            notifications: {
              slack: mData.settings.notifications.slack
            }
          }
        }, errs.handler);
      };
      mActions.saveHipChat = function () {
        if (!mData.settings) { return; }
        $scope.data.user.newSetting(mData.settings._id)
        .update({
          json: {
            notifications: {
              hipchat: mData.settings.notifications.hipchat
            }
          }
        }, errs.handler);
      };
    }
  };
}
