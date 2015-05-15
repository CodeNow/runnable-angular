'use strict';

require('app')
  .factory('populateDockerfile', populateDockerfile);

function populateDockerfile(
  promisify,
  regexpQuote
) {
  return function (sourceDockerfile, state, destDockerfile) {
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
      var ports = state.ports.join(' ');
      state.commands = state.commands || '';
      var commands = state.commands.split('\n')
        .map(function(str) {
          return 'RUN ' + str.trim();
        })
        .join('\n');
      dockerfileBody = replaceStackVersion(dockerfileBody, state.selectedStack)
        .replace(/<user-specified-ports>/gm, ports)
        .replace(/<before-main-repo>/gm, '')
        .replace(/<after-main-repo>/gm, '')
        .replace(/<dst>/gm, '/' + state.dst)
        .replace(/<repo-name>/gm, state.repo.attrs.name)
        .replace(/<main-build-commands>/gm, commands)
        .replace(/<start-command>/gm, state.startCommand)
        .replace(/#default.+/gm, ''); // Remove all default comments that are not
      if (!state.ports.length) {
        dockerfileBody = dockerfileBody.replace('EXPOSE', '');
      }
      return dockerfileBody;
    }

    var dockerfileBody = populateDockerFile(sourceDockerfile.attrs.body);
    return promisify(destDockerfile || sourceDockerfile, 'update')({
      json: {
        body: dockerfileBody
      }
    });
  };


}
