'use strict';

require('app')
  .directive('teamManagement', teamManagement);

function teamManagement() {
  return {
    restrict: 'AE',
    scope: {},
    controller: 'TeamManagementController as TMMC',
    bindToController: true,
    templateUrl: 'teamForm'
  };
}
