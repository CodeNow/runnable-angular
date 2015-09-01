'use strict';

require('app')
  .directive('modalIntegrations', integrations);

function integrations(
  keypather,
  fetchSettings,
  verifyChatIntegration,
  promisify,
  errs,
  $q
) {
  return {
    restrict: 'A',
    templateUrl: 'viewModalIntegrations',
    link: function ($scope) {

      var data = $scope.data = {};
      var actions = $scope.actions = {};

      data.showSlack = true;
      data.settings = {};
      data.slackMembers = {};
      data.verifiedOnInit = false;
      data.verified = false;
      data.slackApiToken = null;
      data.invalidApiToken = false;

      function fetchChatMemberData() {
        data.invalidApiToken = false;
        return verifyChatIntegration(data.slackApiToken, data.settings, 'slack')
          .then(function (members) {
            keypather.set(data, 'settings.attrs.notifications.slack.apiToken', data.slackApiToken);
            data.slackMembers = members.slack;
            data.ghMembers = members.github;
            data.verified = true;
            data.invalidApiToken = false;
          })
          .catch(function (err) {
            data.invalidApiToken = true;
            data.verified = false;
            data.slackMembers = {};
            data.ghMembers = {};
            return $q.reject(err);
          });
      }

      fetchSettings()
        .then(function (settings) {
          data.settings = settings;
          data.slackApiToken = keypather.get(data, 'settings.attrs.notifications.slack.apiToken');
          if ( data.slackApiToken &&
              keypather.get(data, 'settings.attrs.notifications.slack.githubUsernameToSlackIdMap')) {
            data.showSlack = true;
            data.loading = true;
            return fetchChatMemberData();
          }
        })
        .catch(errs.handler)
        .finally(function () {
          data.loading = false;
          data.verifiedOnInit = true;
        });

      actions.verifySlack = function () {
        data.verifying = true;
        return fetchChatMemberData()
          .catch(errs.handler)
          .finally(function () {
            data.verifying = false;
          });
      };

      actions.saveSlack = function () {
        var slackData = {
          apiToken: data.settings.attrs.notifications.slack.apiToken,
          enabled: data.settings.attrs.notifications.slack.enabled
        };
        slackData.githubUsernameToSlackIdMap = data.slackMembers.reduce(function (obj, slackMember) {
          if (slackMember.ghName && !slackMember.found && /*keep calm and*/ slackMember.slackOn) {
            // Name was selected from the dropdown
            obj[slackMember.ghName] = slackMember.id;
          } else if (slackMember.found && slackMember.slackOn) {
            // Autodetected name was checked
            obj[slackMember.ghName] = slackMember.id;
          } else if (slackMember.ghName) {
            // We want to note them but not enable slack
            obj[slackMember.ghName] = null;
          }
          return obj;
        }, {});
        return promisify(data.settings, 'update')({
          json: {
            notifications: {
              slack: slackData
            }
          }
        })
          .catch(errs.handler)
          .then(function (res) {
          });
      };
    }
  };
}
