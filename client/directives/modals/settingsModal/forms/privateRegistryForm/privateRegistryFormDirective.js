'use strict';

require('app')
  .directive('privateRegistryForm', privateRegistryForm);

function privateRegistryForm() {
  return {
    restrict: 'E',
    controller: 'PrivateRegistryFormController',
    controllerAs: 'PRFC',
    templateUrl: 'privateRegistryFormView'
  };
}
