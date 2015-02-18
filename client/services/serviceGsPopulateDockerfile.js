'use strict';

require('app')
  .factory('gsPopulateDockerfile', gsPopulateDockerfile);

function gsPopulateDockerfile(
  promisify,
  regexpQuote
) {
  return function (dockerfile, state) {
    function replaceStackVersion(dockerfileBody, stack) {
      var regexp = new RegExp('<' + regexpQuote(stack.key.toLowerCase()) + '-version>', 'igm');
      if (stack.dependencies) {
        stack.dependencies.forEach(function (stack) {
          dockerfileBody = replaceStackVersion(dockerfileBody, stack);
        });
      }
      return dockerfileBody.replace(regexp, stack.selectedVersion);
    }
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

    var dockerfileBody = populateDockerFile(dockerfile.attrs.body);
    return promisify(dockerfile, 'update')({
      json: {
        body: dockerfileBody
      }
    });
  };


}
