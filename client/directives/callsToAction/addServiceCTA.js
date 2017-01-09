'use strict';

require('app')
  .directive('addServiceCta', addServiceCta);

/**
 * @ngInject
 */
function addServiceCta(
  demoFlowService
) {
  return {
    restrict: 'A',
    templateUrl: 'popoverDemoServiceCTAView',
    scope: {
    },
    link: function (scope, elem, attrs) {
      demoFlowService.getInstances()
        .then(function (instances) {
          instances.on('add', function () {
            demoFlowService.endDemoFlow();
          })
        })
    }
  };
}
