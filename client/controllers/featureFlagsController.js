'use strict';

require('app')
  .controller('FeatureFlagsController', FeatureFlagsController);

function FeatureFlagsController(
  $localStorage,
  ahaGuide
) {
  this.$localStorage = $localStorage;
  this.resetAha = function() {
    ahaGuide.resetGuide();
  };
}
