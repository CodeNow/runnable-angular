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
      dockerfileBody = replaceStackVersion(dockerfileBody, state.selectedStack)
        .replace(/<user-specified-ports>/gm, ports)
        .replace(/<before-main-repo>/gm, '')
        .replace(/<after-main-repo>/gm, '')
        .replace(/<main-build-commands>/gm, state.commands.join('\n'))
        .replace(/<dst>/gm, '/' + state.repo.attrs.name)
        .replace(/<repo-name>/gm, state.repo.attrs.name)
        .replace(/(WORKDIR.*\n)([\s\S]*)(?=#End)/gm,
          function (str, workdir, commands) {
            if (!state.commands) {
              return str;
            }
            return workdir + state.commands.split('\n').map(function(str) {
              console.log('str', str);
              if (str && str.trim().indexOf('#') !== 0) {
                return 'RUN ' + str + '\n';
              }
              return str + '\n';
            }).join('');
          })
        .replace(/<start-command>/gm, state.startCommand);
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
