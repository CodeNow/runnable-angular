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
  keypather,
  $state
) {
  return {
    restrict: 'A',
    templateUrl: 'viewAccountsSelect',
    scope: {
      data: '=',
      isMainPage: '='
    },
    link: function ($scope, elem, attrs) {

      $scope.popoverAccountMenu = {
        actions: {
          actionsModalIntegrations: {}
        },
        data: $scope.data
      };
      var unwatchUserInfo = $scope.$watch('data.activeAccount', function (n) {
        if (n) {
          keypather.set($scope, 'popoverAccountMenu.data.activeAccount', n);
          keypather.set($scope, 'popoverAccountMenu.data.orgs', $scope.data.orgs);
          keypather.set($scope, 'popoverAccountMenu.data.user', $scope.data.user);
        }
      });
      $scope.$on('$destroy', function () {
        unwatchUserInfo();
      });

      keypather.set($scope, 'popoverAccountMenu.data.dataModalIntegrations', $scope.data);
      keypather.set($scope, 'popoverAccountMenu.data.logoutURL', configLogoutURL());
      keypather.set($scope, 'popoverAccountMenu.data.isMainPage', $scope.isMainPage);

      $scope.popoverAccountMenu.actions.selectActiveAccount = function (userOrOrg) {
        $scope.popoverAccountMenu.data.show = false;
        var username = userOrOrg.oauthName();
        $scope.data.activeAccount = userOrOrg;
        if ($scope.isMainPage) {
          $scope.$emit('INSTANCE_LIST_FETCH', username);
          $state.go('^.home', {
            userName: username
          });
        }
      };

      $scope.popoverOptions = $scope.isMainPage ?
          '{\"left\": 124, \"top\": 48}' : '{\"left\": 124, \"top\": 48}';

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
