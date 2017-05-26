'use strict';

require('app')
  .controller('FeatureFlagsController', FeatureFlagsController);

function FeatureFlagsController(
  $localStorage,
  $state,
  ahaGuide,
  demoFlowService,
  customWindowService
) {
  this.$localStorage = $localStorage;
  this.resetAha = function() {
    if (window.confirm('All containers will be deleted. Are you sure you want to reset your account?')) {
      ahaGuide.resetGuide();
      demoFlowService.resetFlags();
      demoFlowService.internalResetFlags();
    }
  };

  // Remove when you remove the composeSSHAuthView flag
  this.upgradeAuth = function () {
    customWindowService($state.href('githubAuthUpgrade'), {
      width: 1020, // match github minimum width
      height: 660
    });
  };
}
