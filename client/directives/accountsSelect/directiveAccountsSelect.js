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
  $state,
  $q,
  fetchSlackMembers,
  fetchGitHubMembers,
  fetchGitHubUser
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
          actionsModalIntegrations: {},
          clearAllUserOptions: function () {
            var userOptions = {};
            ['boxName', 'editButton', 'repoList', 'explorer'].forEach(function (key) {
              userOptions['userOptions.uiState.shownCoachMarks.' + key] = false;
            });
            $scope.popoverAccountMenu.data.show = false;
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
      if (configEnvironment !== 'production') {
        keypather.set($scope, 'popoverAccountMenu.data.inDev', true);
      }
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

      var mActions = $scope.popoverAccountMenu.actions.actionsModalIntegrations;
      var mData = $scope.popoverAccountMenu.data.dataModalIntegrations;

      var unwatch = $scope.$watch('popoverAccountMenu.data.dataModalIntegrations.user', function(account) {
        if (account) {
          mData.settings = {};
          unwatch();
          return promisify($scope.data.user, 'fetchSettings')({
            githubUsername: account.oauthName()
          }).then(function(settings) {
            mData.settings = settings[0];
            if (keypather.get(mData, 'settings.notifications.slack.authToken')) {
              return fetchSlackMembers(mData.settings.notifications.slack.authToken);
            }
          }).then(function (members) {
            mData.slackMembers = members;
          }).catch(errs.handler);
        }
      });

      mActions.closePopover = function() {
        $scope.popoverAccountMenu.data.show = false;
      };
      mActions.verifySlack = function() {
        var slackMembers;
        fetchSlackMembers(mData.settings.notifications.slack.authToken)
        .then(function(_members) {
          slackMembers = _members;
          mData.slackMembers = slackMembers;
          mData.verified = true;
          return fetchGitHubMembers($state.params.userName);
        }).then(function(ghMembers) {
          // Compare the two?
          console.log('yey', slackMembers, ghMembers);

          // Fetch actual names
          var memberFetchPromises = ghMembers.map(function (user) {
            return fetchGitHubUser(user.login).then(function (ghUser) {
              slackMembers.forEach(function (member) {

                if (member.real_name && member.real_name.toLowerCase() === keypather.get(ghUser, 'name.toLowerCase()')) {
                  console.log('Got one!', member.real_name);
                }
              });
            });
          });

          mData.ghMembers = ghMembers;

          return $q.all(memberFetchPromises);
        }).catch(errs.handler);
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
