'use strict';

require('app')
  .controller('FeatureFlagsController', FeatureFlagsController);

function FeatureFlagsController(
  $rootScope,
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

  this.upgradeAuth = function () {
    var w = customWindowService($state.href('githubAuthUpgrade'), {
      width: 1020, // match github minimum width
      height: 660
    });

    w.addEventListener('GH_SCOPE_UPGRADED', function() {
      console.log('listen for the love of all')
      $rootScope.$broadcast('GH_SCOPE_UPGRADED');
    });
    w.addEventListener('close', function() {
      console.log('close event');
    });
  };
}
