'use strict';

require('app')
  .directive('privateRegistryForm', privateRegistryForm);

function privateRegistryForm() {
  return {
    restrict: 'A',
    controller: 'PrivateRegistryFormController',
    controllerAs: 'PRFC',
    templateUrl: 'privateRegistryFormView'
  };
}
