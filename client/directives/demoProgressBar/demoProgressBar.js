'use strict';

require('app')
  .directive('demoProgressBar', demoProgressBar);

/**
 * @ngInject
 */
function demoProgressBar(
  demoFlowService
) {
  return {
    restrict: 'A',
    templateUrl: 'popoverDemoProgressView',
    scope: {
      demoStep: '=',
      isPersonalAccount: '='
    },
    link: function (scope, elem, attrs) {
      scope.endDemo = demoFlowService.endDemoFlow;
    }
  };
}
