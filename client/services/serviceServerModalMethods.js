'use strict';

require('app')
  .factory('serverModalMethods', serverModalMethods);

function serverModalMethods (
  promisify
) {
  var methods = {};

  methods.openDockerfile = function (state, openItems) {
    var SMC = this;
    return promisify(state.contextVersion, 'fetchFile')('/Dockerfile')
      .then(function (dockerfile) {
        if (state.dockerfile) {
         openItems.remove(SMC.state.dockerfile);
        }
        if (dockerfile) {
          openItems.add(dockerfile);
        }
        state.dockerfile = dockerfile;
      });
  };

  return methods;
}
