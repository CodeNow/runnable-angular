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
          return promisify(account, 'fetchSettings')({
            githubUsername: $state.params.userName
          }).then(function(settings) {
            console.log('settings', settings.models[0]);
            mData.settings = settings.models[0];
            if (keypather.get(mData, 'settings.attrs.notifications.slack.apiToken')) {
              mData.showSlack = true;
              // TODO: Don't verify every time
              return mActions.verifySlack();
            }
          }).catch(errs.handler);
        }
      });

      mActions.closePopover = function() {
        $scope.popoverAccountMenu.data.show = false;
      };
      mActions.verifySlack = function() {
        var matches = [];
        var slackMembers, ghMembers;
        fetchSlackMembers(mData.settings.attrs.notifications.slack.apiToken)
        .then(function(_members) {
          slackMembers = _members;
          mData.slackMembers = slackMembers;
          return fetchGitHubMembers($state.params.userName);
        }).then(function(_ghMembers) {
          ghMembers = _ghMembers;

          // Fetch actual names
          var memberFetchPromises = ghMembers.map(function (user) {
            return fetchGitHubUser(user.login).then(function (ghUser) {
              slackMembers.forEach(function (member) {

                if (member.real_name && member.real_name.toLowerCase() === keypather.get(ghUser, 'name.toLowerCase()')) {
                  // TODO: handle case with multiple users of the same name
                  member.found = true;
                  member.ghName = ghUser.login;
                  matches.push(ghUser.login);
                }
              });
            });
          });

          return $q.all(memberFetchPromises);
        }).then(function() {
          mData.ghMembers = ghMembers.reduce(function(arr, member) {
            if (member.login && matches.indexOf(member.login) === -1) {
              arr.push(member.login);
            }
            return arr;
          }, []);
          mData.verified = true;
        }).catch(errs.handler);
      };
      mActions.saveSlack = function () {
        var slackData = {
          apiToken: mData.settings.attrs.notifications.slack.apiToken
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
      mActions.saveHipChat = function () {
        $scope.data.user.newSetting(mData.settings.id())
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
