'use strict';

require('app')
  .controller('SlackIntegrationFormController', SlackIntegrationFormController);

/**
 * @ngInject
 */
function SlackIntegrationFormController (
  $q,
  $scope,
  debounce,
  errs,
  fetchSettings,
  keypather,
  promisify,
  fetchChatMembersAndMapToUsers
) {
  var SIFC = this;
  angular.extend(SIFC, {
    /**
     * States:
     * 1. `loading`: The modal is loading data and the spinner is shown
     * 2. `not-verified`: There is no valid API token saved
     * 3. `verifying`: Verifying the API token. Showing the spinner in the verify token button
     * 4. `verified`: There is a verified token and the GH/Slack members are showed
     */
    state: 'loading',
    settings: {},
    ghMembers: [],
    slackMembers: [],
    slackApiToken: null
  });

  var tokenMatchExpression = /(api).*(invalid)/i;

  function fetchChatMemberData() {
    return fetchChatMembersAndMapToUsers(SIFC.slackApiToken, SIFC.settings, 'slack')
      .then(function (members) {
        SIFC.slackMembers = members.slack;
        SIFC.ghMembers = members.github;
      })
      .catch(function (err) {
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
      SIFC.slackApiToken = keypather.get(SIFC, 'settings.attrs.notifications.slack.apiToken');
      if (SIFC.slackApiToken) {
        // If there is an API token, verify it
        // It should not be saved unless it's a valid token
        return fetchChatMemberData()
          .then(function () {
            SIFC.state = 'verified';
          });
      }
      SIFC.state = 'not-verified';
      return false;
    })
    .catch(function (err) {
      SIFC.state = 'not-verified';
      return slackErrorHandler(err);
    });

  SIFC.verifySlack = function () {
    // Only verify and update the token if it's a valid token
    if (!SIFC.slackApiTokenForm.$valid) {
      return false;
    }
    SIFC.state = 'verifying';
    return fetchChatMemberData()
      .then(function () {
        // Token provided by user is valid. Update our settings.
        var slackData = {
          apiToken: SIFC.slackApiToken,
          enabled: keypather.get(SIFC, 'settings.attrs.notifications.slack.enabled')
        };
        return updateSlackSettings(slackData)
          .then(function () {
            SIFC.state = 'verified';
          });
      })
      .catch(function (err) {
        SIFC.state = 'not-verified';
        return slackErrorHandler(err);
      });
  };

  SIFC.deleteAPIToken = function () {
    SIFC.state = 'loading';
    var slackData = {
      apiToken: '', // I would have used `null`, but API complains
      enabled: keypather.get(SIFC, 'settings.attrs.notifications.slack.enabled')
    };
    return updateSlackSettings(slackData)
      .then(function () {
        SIFC.state = 'not-verified';
        SIFC.slackApiToken = '';
      })
      .catch(function (err) {
        SIFC.state = 'verified';
        return slackErrorHandler(err);
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
}
