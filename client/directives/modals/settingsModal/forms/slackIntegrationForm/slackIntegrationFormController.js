'use strict';

require('app')
  .controller('SlackIntegrationFormController ', SlackIntegrationFormController );

/**
 * @ngInject
 */
function SlackIntegrationFormController () {
  console.log('SlackIntegrationFormController');
  var SIFC = this;
  angular.extend(SIFC, {
    loading: true,
    members: null
  });
}


