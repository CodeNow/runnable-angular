/*global promisify: true */
'use strict';

require('app')
  .controller('ServerModalController', ServerModalController);

function ServerModalController ($scope, promisify) {

  this.openDockerfile = function () {
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
}

