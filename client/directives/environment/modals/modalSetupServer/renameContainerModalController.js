'use strict';

require('app')
  .controller('RenameContainerModalController', RenameContainerModalController);

function RenameContainerModalController(
  $scope,
  close,
  name
) {
  var RCMC = this;
  RCMC.name = name;
  RCMC.cancel = function () {
    return close(null);
  };
  RCMC.confirm = function () {
    if (RCMC.renameForm.$invalid) {
      return close(null);
    }
    return close(RCMC.name);
  };
}
