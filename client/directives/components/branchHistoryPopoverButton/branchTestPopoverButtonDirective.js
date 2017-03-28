'use strict';

require('app')
  .directive('branchTestPopoverButton', branchTestPopoverButton);

function branchTestPopoverButton() {
  return {
    restrict: 'A',
    templateUrl: 'branchTestPopoverButtonView',
    controller: 'BranchTestPopoverButtonController',
    controllerAs: 'BTPBC',
    bindToController: true,
    scope: {
      instance: '='
    }
  };
}
