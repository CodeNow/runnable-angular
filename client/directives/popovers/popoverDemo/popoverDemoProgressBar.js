'use strict';

require('app')
  .directive('demoProgressBar', demoProgressBar);

/**
 * @ngInject
 */
function demoProgressBar(
  demoFlowService,
  currentOrg
) {
  return {
    restrict: 'A',
    templateUrl: 'popoverDemoProgressView',
    scope: {
      demoStep: '='
    },
    link: function (scope, elem, attrs) {
      scope.isPersonalAccount = currentOrg.isPersonalAccount();
      scope.endDemo = demoFlowService.endDemoFlow;
    }
  };
}
