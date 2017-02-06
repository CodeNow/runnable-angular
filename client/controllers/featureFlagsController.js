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
    if (window.confirm('All containers will be deleted. Are you sure you want to reset your account?')) {
      ahaGuide.resetGuide();
    }
  };
}
