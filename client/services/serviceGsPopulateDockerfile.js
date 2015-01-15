'use strict';

require('app')
  .factory('gsPopulateDockerfile', gsPopulateDockerfile);

function gsPopulateDockerfile(
  regexpQuote
) {
  return function (dockerfile, state) {
    function populateDockerFile(dockerfileBody) {
      // first, add the ports
      dockerfileBody = replaceStackVersion(dockerfileBody, state.stack);
      var ports = state.ports.split(',').join(' ');
      dockerfileBody = dockerfileBody.replace(/<user-specified-ports>/gm, ports);

      // Add Repo
      dockerfileBody = dockerfileBody.replace(/<repo-name>/gm, state.selectedRepo.attrs.name);

      // For now, just remove this
      dockerfileBody = dockerfileBody.replace(/<add-dependencies>/gm, '');
      var startCommand = state.startCommand;
      dockerfileBody = dockerfileBody.replace(/<start-command>/gm, startCommand);
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
