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
    link: function ($scope) {

      $scope.popoverAccountMenu = {
        actions: {
          actionsModalIntegrations: {},
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
      keypather.set($scope, 'popoverAccountMenu.data.isMainPage', $scope.isMainPage);

      var mActions = $scope.popoverAccountMenu.actions.actionsModalIntegrations;
      var mData = $scope.popoverAccountMenu.data.dataModalIntegrations;

      if (configEnvironment !== 'production') {
        keypather.set($scope, 'popoverAccountMenu.data.inDev', true);
      }
      $scope.$watch('data.activeAccount', function (account) {
        if (!account) { return; }
        keypather.set($scope, 'popoverAccountMenu.data.activeAccount', account);
        keypather.set($scope, 'popoverAccountMenu.data.orgs', $scope.data.orgs);
        keypather.set($scope, 'popoverAccountMenu.data.user', $scope.data.user);

        if (!$scope.isMainPage) { return; }

        // Integrations modal
        if ($scope.data.user.oauthName() === $state.params.userName) {
          mData.showIntegrations = false;
          return;
        }

        // Only Slack for now, will expand when customers request it
        mData.showIntegrations = true;
        mData.showSlack = true;
        mData.settings = {};
        mData.slackMembers = {};
        mData.verified = false;
        return promisify($scope.data.user, 'fetchSettings')({
          githubUsername: $state.params.userName
        })
        .then(function(settings) {
          mData.settings = settings.models[0];
          if (keypather.get(mData, 'settings.attrs.notifications.slack.apiToken') &&
            keypather.get(mData, 'settings.attrs.notifications.slack.githubUsernameToSlackIdMap')) {
            mData.showSlack = true;
            return mActions.verifySlack(true);
          }
        })
        .catch(errs.handler);
      });

      $scope.popoverAccountMenu.actions.selectActiveAccount = function (userOrOrg) {
        $scope.$broadcast('close-popovers');
        var username = userOrOrg.oauthName();
        $scope.data.activeAccount = userOrOrg;
        if ($scope.isMainPage) {
          $scope.$emit('INSTANCE_LIST_FETCH', username);
          $state.go('^.home', {
            userName: username
          });
        }
      };

      mActions.closePopover = function() {
        $scope.$broadcast('close-popovers');
      };
      mActions.verifySlack = function(loadingPreviousResults) {
        var matches = [];
        if (loadingPreviousResults) {
          mData.loading = true;
        } else {
          mData.verifying = true;
        }
        fetchSlackMembers(mData.settings.attrs.notifications.slack.apiToken)
        .then(function(members) {
          mData.slackMembers = members;
          return fetchGitHubMembers($state.params.userName);
        })
        .then(function(ghMembers) {

          // Fetch actual names
          var memberFetchPromises = ghMembers.map(function (user) {
            return fetchGitHubUser(user.login).then(function (ghUser) {
              mData.slackMembers.forEach(function (member) {

                if (member.real_name && member.real_name.toLowerCase() === keypather.get(ghUser, 'name.toLowerCase()')) {
                  // TODO: handle case with multiple users of the same name
                  member.found = true;
                  member.ghName = ghUser.login;
                  matches.push(ghUser.login);
                }
                if (keypather.get(mData, 'settings.attrs.notifications.slack.githubUsernameToSlackIdMap.' + ghUser.login) ===
                  member.id) {
                  member.slackOn = true;
                  member.ghName = ghUser.login;
                }
              });
              return ghUser;
            });
          });

          return $q.all(memberFetchPromises);
        })
        .then(function(ghMembers) {
          // Using .reduce here because all we care about is member.login
          mData.ghMembers = ghMembers.reduce(function(arr, member) {
            if (member.login && matches.indexOf(member.login) === -1) {
              arr.push(member.login);
            }
            return arr;
          }, []);
          mData.verified = true;
        })
        .catch(errs.handler)
        .finally(function () {
          mData.loading = false;
          mData.verifying = false;
        });
      };
      mActions.saveSlack = function () {
        var slackData = {
          apiToken: mData.settings.attrs.notifications.slack.apiToken,
          enabled: mData.settings.attrs.notifications.slack.enabled
        };
        slackData.githubUsernameToSlackIdMap = mData.slackMembers.reduce(function (obj, slackMember) {
          if (slackMember.ghName && !slackMember.found) {
            // Name was selected from the dropdown
            obj[slackMember.ghName] = slackMember.id;
          } else if (slackMember.found && slackMember.slackOn) {
            // Autodetected name was checked
            obj[slackMember.ghName] = slackMember.id;
          } else {
            // We want to note them but not enable slack
            obj[slackMember.ghName] = null;
          }
          return obj;
        }, {});

        return promisify(mData.settings, 'update')({
          json: {
            notifications: {
              slack: slackData
            }
          }
        })
        .catch(errs.handler);
      };
    }
  };
}
