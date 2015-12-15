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
    slackApiToken: null
  });

  var tokenMatchExpression = /(api).*(invalid)/i;

  function fetchChatMemberData() {
    return verifyChatIntegration(SIFC.slackApiToken, SIFC.settings, 'slack')
      .then(function (members) {
        SIFC.slackMembers = members.slack;
        SIFC.ghMembers = members.github;
        SIFC.verified = true;
        if (keypather.get(SIFC, 'slackApiTokenForm.slackApiTokenField.$setValidity')) {
          SIFC.slackApiTokenForm.slackApiTokenField.$setValidity('tokenValid', true);
        }
      })
      .catch(function (err) {
        SIFC.verified = false;
        if (err.message.match(tokenMatchExpression)) {
          if (keypather.get(SIFC, 'slackApiTokenForm.slackApiTokenField.$setValidity')) {
            SIFC.slackApiTokenForm.slackApiTokenField.$setValidity('tokenValid', false);
          }
        }
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
    })
    .then(function () {
      // Update our local copy of the settings
      var slackOptions = keypather.get(SIFC, 'settings.attrs.notifications.slack');
      angular.extend(slackOptions, slackSettingsObject);
      return;
    });
  }

  function slackErrorHandler (err) {
    // If the API token is invalid, don't show a popup. Only show the formatting in the UI
    if (err.message.match(tokenMatchExpression)) {
      return true;
    }
    return errs.handler(err);
  }

  fetchSettings()
    .then(function (settings) {
      SIFC.settings = settings;
      SIFC.loading = true;
      SIFC.slackApiToken = keypather.get(SIFC, 'settings.attrs.notifications.slack.apiToken');
      if (SIFC.slackApiToken) {
        // If there is an API token, verify it
        // It should not be saved unless it's a valid token
        return fetchChatMemberData();
      }
      return false;
    })
    .catch(slackErrorHandler)
    .finally(function () {
      SIFC.loading = false;
    });

  SIFC.verifySlack = function () {
    // Only verify and update the token if it's a valid token
    if (SIFC.slackApiTokenForm.$pristine) {
      return false;
    }
    SIFC.verifying = true;
    return fetchChatMemberData()
      .then(function () {
        // Token provided by user is valid. Update our settings.
        var slackData = {
          apiToken: SIFC.slackApiToken,
          enabled: keypather.get(SIFC, 'settings.attrs.notifications.slack.enabled')
        };
        return updateSlackSettings(slackData);
      })
      .catch(slackErrorHandler)
      .finally(function () {
        SIFC.verifying = false;
      });
  };

  SIFC.deleteAPIToken = function () {
    SIFC.verified = false;
    SIFC.loading = true;
    var slackData = {
      apiToken: '', // I would have used `null`, but API complains
      enabled: keypather.get(SIFC, 'settings.attrs.notifications.slack.enabled')
    };
    return updateSlackSettings(slackData)
      .then(function () {
         SIFC.slackApiToken = '';
      })
      .catch(slackErrorHandler)
      .finally(function () {
        SIFC.loading = false;
      });
  };

  SIFC.saveSlack = debounce(function () {
    var slackData = {
      apiToken: keypather.get(SIFC, 'settings.attrs.notifications.slack.apiToken'),
      enabled: keypather.get(SIFC, 'settings.attrs.notifications.slack.enabled')
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
      .catch(slackErrorHandler);
  }, 250);

  SIFC.setFieldAsValid = function () {
    if (keypather.get(SIFC, 'slackApiTokenForm.slackApiTokenField.$setValidity')) {
      SIFC.slackApiTokenForm.slackApiTokenField.$setValidity('tokenValid', true);
    }
  };
}
