'use strict';

require('app')
  .controller('NewContainerModalController', NewContainerModalController);

function NewContainerModalController(
  ahaGuide,
  close
) {
  var NCMC = this;
  NCMC.isAddingFirstRepo = ahaGuide.isAddingFirstRepo;
  NCMC.close = close;
}
