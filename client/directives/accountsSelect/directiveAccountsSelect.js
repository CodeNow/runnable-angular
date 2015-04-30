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
  configEnvironment,
  errs,
  keypather,
  promisify,
  $state
) {
  return {
    restrict: 'AE',
    templateUrl: 'viewAccountsSelect',
    scope: {
      data: '='
    },
    link: function ($scope) {

      $scope.popoverAccountMenu = {
        actions: {
          logout: function () {
            promisify($scope.data.user, 'logout')().then(function () {
              window.location = '/';
            }).catch(errs.handler);
          },
          clearAllUserOptions: function () {
            var userOptions = {};
            ['boxName', 'editButton', 'repoList', 'explorer'].forEach(function (key) {
              userOptions['userOptions.uiState.shownCoachMarks.' + key] = false;
            });
            $scope.$broadcast('close-popovers');
            // Make user update call here
            promisify($scope.data.user, 'update')(
              userOptions
            ).catch(
              errs.handler
            ).finally(function () {
              $state.reload();
            });
          }
        },
        data: $scope.data
      };

      keypather.set($scope, 'popoverAccountMenu.data.dataModalIntegrations', $scope.data);
      keypather.set($scope, 'popoverAccountMenu.data.logoutURL', configLogoutURL());

      if (configEnvironment !== 'production') {
        keypather.set($scope, 'popoverAccountMenu.data.inDev', true);
      }
      $scope.$watch('data.activeAccount', function (account) {
        if (!account) { return; }
        keypather.set($scope, 'popoverAccountMenu.data.activeAccount', account);
        keypather.set($scope, 'popoverAccountMenu.data.orgs', $scope.data.orgs);
        keypather.set($scope, 'popoverAccountMenu.data.user', $scope.data.user);

        // Integrations modal
        if ($scope.data.user.oauthName() === $state.params.userName) {
          $scope.popoverAccountMenu.data.showIntegrations = false;
        } else {
          $scope.popoverAccountMenu.data.showIntegrations = true;
        }
      });

      $scope.popoverAccountMenu.actions.selectActiveAccount = function (userOrOrg) {
        var username = userOrOrg.oauthName();
        $scope.$broadcast('close-popovers');
        $state.go('^.home', {
          userName: username
        }).then(function () {
          $scope.data.activeAccount = userOrOrg;
          $scope.$emit('INSTANCE_LIST_FETCH', username);
        });
      };
    }
  };
}
