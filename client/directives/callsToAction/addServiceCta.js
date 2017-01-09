'use strict';

require('app')
  .directive('addServiceCta', addServiceCta);

/**
 * @ngInject
 */
function addServiceCta(
  demoFlowService,
  fetchInstancesByPod
) {
  return {
    restrict: 'A',
    templateUrl: 'popoverDemoServiceCTAView',
    scope: {
    },
    link: function (scope, elem, attrs) {
      fetchInstancesByPod()
        .then(function (instances) {
          instances.on('add', function () {
            demoFlowService.endDemoFlow();
          });
        });
    }
  };
}
