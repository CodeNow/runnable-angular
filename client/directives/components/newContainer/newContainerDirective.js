'use strict';

require('app')
  .directive('newContainer', newContainer);

function newContainer(
) {
  return {
    restrict: 'A',
    templateUrl: function (element, attrs) {
      if (attrs.newContainer === 'modal') {
        return 'newContainerConfigureView';
      }
      return 'newContainerTooltipView';
    },
    controller: 'NewContainerController',
    controllerAs: 'NCC',
    bindToController: true,
    scope: {
      close: '=',
      state: '=?'
    }
  };
}
