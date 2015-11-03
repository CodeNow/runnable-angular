'use strict';

require('app')
  .controller('FeatureFlagsController', FeatureFlagsController);

function FeatureFlagsController(
  $localStorage
) {
  this.$localStorage = $localStorage;
}
