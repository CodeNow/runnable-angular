'use strict';

require('app')
  .directive('slackIntegrationForm', slackIntegrationForm);

function slackIntegrationForm() {
  return {
    restrict: 'AE',
    controller: 'SlackIntegrationFormController as SIFC',
    templateUrl: 'slackIntegrationFormView'
  };
}
