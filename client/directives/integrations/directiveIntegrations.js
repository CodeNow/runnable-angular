'use strict';

require('app')
  .directive('integrations', integrations);

function integrations (
  keypather,
  fetchSettings,
  verifyChatIntegration,
  promisify,
  errs
) {
  return {
    restrict: 'E',
    templateUrl: 'viewIntegrations',
    link: function ($scope) {
      var data = $scope.data = {};
      var actions = $scope.actions = {};

      data.showIntegrations = true;
      data.showSlack = true;
      data.settings = {};
      data.slackMembers = {};
      data.verified = false;

      fetchSettings()
      .then(function (settings) {
        data.settings = settings;
        if (keypather.get(data, 'settings.attrs.notifications.slack.apiToken') &&
          keypather.get(data, 'settings.attrs.notifications.slack.githubUsernameToSlackIdMap')) {
          data.showSlack = true;
          return actions.verifySlack(true);
        }
      })
      .catch(errs.handler);

      actions.verifySlack = function(loadingPreviousResults) {
        var matches = [];
        if (loadingPreviousResults) {
          data.loading = true;
        } else {
          data.verifying = true;
        }
        return verifyChatIntegration(data.settings, 'slack')
        .then(function (members) {
          data.slackMembers = members.slack;
          data.ghMembers = members.github;
          data.verified = true;
        })
        .catch(errs.handler)
        .finally(function () {
          data.loading = false;
          data.verifying = false;
        });
      };

      // Closes the account select popover on modal open
      actions.closePopover = function() {
        $scope.popoverAccountMenu.data.show = false;
      };
      actions.saveSlack = function () {
        var slackData = {
          apiToken: data.settings.attrs.notifications.slack.apiToken,
          enabled: data.settings.attrs.notifications.slack.enabled
        };
        slackData.githubUsernameToSlackIdMap = data.slackMembers.reduce(function (obj, slackMember) {
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