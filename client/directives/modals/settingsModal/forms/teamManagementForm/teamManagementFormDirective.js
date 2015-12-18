'use strict';

require('app')
  .directive('teamManagementForm', teamManagementForm);

function teamManagementForm() {
  return {
    restrict: 'AE',
    controller: 'TeamManagementFormController as TMMC',
    templateUrl: 'teamManagementFormView'
  };
}
