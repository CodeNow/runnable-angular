'use strict';

require('app')
  .directive('teamManagementForm', teamManagementForm);

function teamManagementForm() {
  return {
    restrict: 'AE',
    scope: {},
    controller: 'TeamManagementFormController as TMMC',
    bindToController: true,
    templateUrl: 'teamManagementFormView'
  };
}
