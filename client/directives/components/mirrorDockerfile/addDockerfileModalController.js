'use strict';

require('app')
  .controller('AddDockerfileModalController', AddDockerfileModalController);

function AddDockerfileModalController(
  branchName,
  close,
  fullRepo
) {
  var MC = this;
  MC.branchName = branchName;
  MC.fullRepo = fullRepo;
  MC.confirm = function (savedValue) {
    close(savedValue);
  };
  MC.cancel = function () {
    close();
  };
}
