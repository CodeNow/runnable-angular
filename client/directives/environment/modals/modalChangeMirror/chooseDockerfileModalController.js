'use strict';

require('app')
  .controller('ChooseDockerfileModalController', ChooseDockerfileModalController);

/**
 * This controller is for a modal that displays the MirroringDockerfile component.  This modal just
 * wraps that component, and returns the selected dockerfile in the close
 *
 * @param {Function}   close      - close fn for the modal
 * @param {Repository} repo       - api-client model which will hold the dockerfiles
 * @param {String}     branchName - name of the branch that will be used
 */
function ChooseDockerfileModalController(
  close,
  repo,
  branchName
) {
  var CDMC = this;
  if (!repo) {
    throw new Error('A repo is required for this controller');
  }
  angular.extend(CDMC, {
    name: 'ChooseDockerfileModal',
    state: {
      repo: repo
    },
    branchName: branchName
  });

  CDMC.cancel = close.bind(null, false);

  CDMC.confirm = function (dockerfile) {
    if (dockerfile) {
      return close(dockerfile);
    }
    throw new Error('Dockerfile path needed');
  };
}

