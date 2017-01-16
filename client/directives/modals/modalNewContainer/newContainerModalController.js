'use strict';

require('app')
  .controller('NewContainerModalController', NewContainerModalController);

function NewContainerModalController(
  ahaGuide,
  close,
  optionalInputs
) {
  var NCMC = this;
  NCMC.isAddingFirstRepo = ahaGuide.isAddingFirstRepo;
  NCMC.close = close;
  NCMC.state = optionalInputs.state || {};
}
