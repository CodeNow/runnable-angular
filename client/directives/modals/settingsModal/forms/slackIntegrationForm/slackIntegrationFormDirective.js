'use strict';

require('app')
  .directive('slackIntegrationForm', slackIntegrationForm);

function slackIntegrationForm() {
  return {
    restrict: 'AE',
    scope: {},
    controller: 'SlackIntegrationFormController as SIFC',
    bindToController: true,
    templateUrl: 'slackIntegrationFormView'
  };
}
