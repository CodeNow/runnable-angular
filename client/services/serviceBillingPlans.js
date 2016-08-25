'use strict';

require('app')
  .factory('billingPlans', billingPlans);

function billingPlans() {
  return {
    'runnable-starter': {
      name: 'Starter',
      costPerUser: 900,
      maxConfigurations: 2
    },
    'runnable-standard': {
      name: 'Standard',
      costPerUser: 2900,
      maxConfigurations: 7
    },
    'runnable-plus': {
      name: 'Plus',
      costPerUser: 4900,
      maxConfigurations: 15
    }
  };
}
