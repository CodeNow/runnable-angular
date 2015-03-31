'use strict';

require('app')
  .directive('modalIntegrations', integrations);

function integrations(
  $rootScope,
  keypather,
  fetchSettings,
  verifyChatIntegration,
  promisify,
  errs
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
      data.verified = false;

      function verifySlack() {
        var matches = [];
        return verifyChatIntegration(data.settings, 'slack')
          .then(function (members) {
            data.slackMembers = members.slack;
            data.ghMembers = members.github;
            data.verified = true;
          });
      }

      fetchSettings()
        .then(function (settings) {
          data.settings = settings.models[0];

          if (keypather.get(data, 'settings.attrs.notifications.slack.apiToken') &&
              keypather.get(data, 'settings.attrs.notifications.slack.githubUsernameToSlackIdMap')) {
            data.showSlack = true;
            data.loading = true;
            return verifySlack();
          }
        })
        .catch(errs.handler)
        .finally(function () {
          data.loading = false;
        });

      actions.verifySlack = function () {
        data.verifying = true;
        return verifySlack()
          .catch(errs.handler)
          .finally(function () {
            $scope.data.verifying = false;
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
          } else {
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
          .catch(errs.handler);
      };
    }
  };
}