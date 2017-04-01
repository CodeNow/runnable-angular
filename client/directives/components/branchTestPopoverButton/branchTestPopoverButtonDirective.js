'use strict';

require('app')
  .directive('branchTestPopoverButton', branchTestPopoverButton);

function branchTestPopoverButton() {
  return {
    restrict: 'E',
    templateUrl: 'branchTestPopoverButtonView',
    controller: 'BranchTestPopoverButtonController',
    controllerAs: 'BTPBC',
    bindToController: true,
    scope: {
      instance: '='
    }
  };
}
