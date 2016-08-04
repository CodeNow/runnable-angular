'use strict';

require('app')
  .factory('billingPlans', billingPlans);

function billingPlans() {
  return {
    starter: {
      name: 'Starter',
      costPerUser: 9,
      maxConfigurations: 2
    },
    standard: {
      name: 'Standard',
      costPerUser: 29,
      maxConfigurations: 7
    },
    plus: {
      name: 'Plus',
      costPerUser: 49,
      maxConfigurations: 15
    }
  };
}
