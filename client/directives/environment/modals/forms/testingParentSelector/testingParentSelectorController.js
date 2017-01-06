'use strict';

require('app')
  .controller('TestingParentSelectorController', TestingParentSelectorController);

function TestingParentSelectorController(
  fetchInstancesByPod
) {
  var TPSC = this;
  TPSC.masterpods = [];
  fetchInstancesByPod()
    .then(function (masterpods) {
      TPSC.masterpods = masterpods.models;
    });
}
