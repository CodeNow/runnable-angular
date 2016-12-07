'use strict';

require('app')
  .controller('FeatureFlagsController', FeatureFlagsController);

function FeatureFlagsController(
  $localStorage,
  ahaGuide,
  demoFlowService
) {
  this.$localStorage = $localStorage;
  this.resetAha = function() {
    ahaGuide.resetGuide();
    demoFlowService.resetFlags();
  };
}
