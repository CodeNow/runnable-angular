'use strict';

require('app')
  .factory('populateDockerfile', populateDockerfile);

function populateDockerfile(
  promisify,
  regexpQuote,
  keypather
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

      var containerFilesString = '';
      var containerFiles = keypather.get(state, 'containerFiles') || [];
      containerFiles.forEach(function (containerFile) {
        containerFilesString += '\n' + containerFile.toString() + '\n';
      });

      dockerfileBody = replaceStackVersion(dockerfileBody, state.selectedStack);

      var beforeIndex = dockerfileBody.indexOf('<before-main-repo>');
      var afterIndex = dockerfileBody.indexOf('<after-main-repo>');

      dockerfileBody = dockerfileBody.slice(0, beforeIndex) + containerFilesString + dockerfileBody.slice(afterIndex + '<after-main-repo>'.length);

      dockerfileBody = dockerfileBody
        .replace(/<user-specified-ports>/gm, ports)
        .replace(/<dst>/gm, '/' + state.dst)
        .replace(/<container-files>/gm, containerFilesString)
        .replace(/<start-command>/gm, state.startCommand)
        .replace(/#default.+/gm, ''); // Remove all default comments that are not

      if (!state.ports.length) {
        dockerfileBody = dockerfileBody.replace('EXPOSE', '');
      }
      console.log('Generated dockerfile \n', dockerfileBody);
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
