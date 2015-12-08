'use strict';

require('app')
  .controller('SlackIntegrationFormController', SlackIntegrationFormController);

/**
 * @ngInject
 */
function SlackIntegrationFormController (
  $scope,
  verifyChatIntegration,
  keypather,
  fetchSettings,
  debounce,
  errs,
  promisify,
  $q
) {
  var SIFC = this;
  angular.extend(SIFC, {
    loading: true,
    verifying: false,
    verified: false,
    settings: {},
    ghMembers: [],
    slackMembers: [],
    slackApiToken: null,
  });

  function fetchChatMemberData() {
    return verifyChatIntegration(SIFC.slackApiToken, SIFC.settings, 'slack')
      .then(function (members) {
        keypather.set(SIFC, 'settings.attrs.notifications.slack.apiToken', SIFC.slackApiToken);
        SIFC.slackMembers = members.slack;
        SIFC.ghMembers = members.github;
        SIFC.verified = true;
      })
      .catch(function (err) {
        SIFC.verified = false;
        return $q.reject(err);
      });
  }

  function updateSlackSettings (slackSettingsObject) {
    return promisify(SIFC.settings, 'update')({
      json: {
        notifications: {
          slack: slackSettingsObject
        }
      }
    });
  }

  fetchSettings()
    .then(function (settings) {
      SIFC.settings = settings;
      SIFC.slackApiToken = keypather.get(SIFC, 'settings.attrs.notifications.slack.apiToken');
      SIFC.loading = true;
      return fetchChatMemberData();
    })
    .catch(errs.handler)
    .finally(function () {
      SIFC.loading = false;
    });

  SIFC.verifySlack = function () {
    SIFC.verifying = true;
    var slackData = {
      apiToken: SIFC.settings.attrs.notifications.slack.apiToken,
      enabled: SIFC.settings.attrs.notifications.slack.enabled
    };
    return updateSlackSettings(slackData)
      .then(function () {
        SIFC.slackApiToken = keypather.get(SIFC, 'settings.attrs.notifications.slack.apiToken');
        return fetchChatMemberData();
      })
      .catch(errs.handler)
      .finally(function () {
        SIFC.verifying = false;
      });
  };

  SIFC.deleteAPIToken = function () {
    SIFC.verified = false;
    SIFC.loading = true;
    var slackData = {
      // I would have used `null`, but API complains
      apiToken: '',
      enabled: SIFC.settings.attrs.notifications.slack.enabled
    };
    return updateSlackSettings(slackData)
      .catch(errs.handler)
      .finally(function () {
        SIFC.loading = false;
      });
  };

  SIFC.saveSlack = debounce(function () {
    var slackData = {
      apiToken: SIFC.settings.attrs.notifications.slack.apiToken,
      enabled: SIFC.settings.attrs.notifications.slack.enabled
    };
    slackData.githubUsernameToSlackIdMap = SIFC.slackMembers.reduce(function (obj, slackMember) {
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
    return updateSlackSettings(slackData)
      .catch(errs.handler);
  }, 250);
}
