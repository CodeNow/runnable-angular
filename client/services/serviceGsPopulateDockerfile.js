'use strict';

require('app')
  .factory('gsPopulateDockerfile', gsPopulateDockerfile);

function gsPopulateDockerfile(
  regexpQuote
) {
  return function (dockerfile, state) {
    function populateDockerFile(dockerfileBody) {
      // first, add the ports
      var ports = state.ports.split(',').join(' ');
      dockerfileBody = replaceStackVersion(dockerfileBody, state.stack)
        .replace(/<user-specified-ports>/gm, ports)
        .replace(/<repo-name>/gm, state.selectedRepo.attrs.name)
        .replace(/<add-dependencies>/gm, '')
        .replace(/<start-command>/gm, state.startCommand);
      return dockerfileBody;
    }

    function updateNewDockerfile(body, cb) {
      dockerfile.update({
        json: {
          body: body
        }
      }, function (err) {
        cb(err);
      });
    }
    return function (cb) {
      var dockerfileBody = populateDockerFile(dockerfile.attrs.body);
      updateNewDockerfile(dockerfileBody, cb);
    };
  };

  function replaceStackVersion(dockerfileBody, stack) {
    var regexp = new RegExp('<' + regexpQuote(stack.key.toLowerCase()) + '-version>', 'igm');
    if (stack.dependencies) {
      stack.dependencies.forEach(function (stack) {
        dockerfileBody = replaceStackVersion(dockerfileBody, stack);
      });
    }
    return dockerfileBody.replace(regexp, stack.selectedVersion);
  }
}
