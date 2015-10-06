'use strict';

require('app')
  .factory('serverModalMethods', serverModalMethods);

function serverModalMethods (
  promisify
) {
  var methods = {};

  methods.openDockerfile = function () {
    var SMC = this;
    return promisify(SMC.state.contextVersion, 'fetchFile')('/Dockerfile')
      .then(function (dockerfile) {
        if (SMC.state.dockerfile) {
         SMC.openItems.remove(SMC.state.dockerfile);
        }
        if (dockerfile) {
          SMC.openItems.add(dockerfile);
        }
        SMC.state.dockerfile = dockerfile;
      });
  };

  return methods;
}
