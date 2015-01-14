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
      var ports = '\nEXPOSE ' + state.ports.split(',').join(' ');
      dockerfileBody = dockerfileBody.replace(/<user-specified-ports>/gm, ports);

      // Add Repo
      var repoName = state.selectedRepo.attrs.full_name.split('\/')[1];
      var repo = '\nADD .\/' + repoName + ' \/' + repoName;
      dockerfileBody = dockerfileBody.replace(/<add-repo>/gm, repo);
      dockerfileBody = dockerfileBody.replace(/<repo-name>/gm, state.selectedRepo.attrs.full_name);

      // For now, just remove this
      dockerfileBody = dockerfileBody.replace(/<add-dependencies>/gm, '');
      var startCommand = '\nCMD ' + state.startCommand;
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
    var regexp = new RegExp('<' + regexpQuote(stack.key.toLowerCase()) + '-version>', 'gm');
    console.log('replacing version', stack.name, regexp, stack.selectedVersion);
    if (stack.dependencies) {
      stack.dependencies.forEach(function (stack) {
        dockerfileBody = replaceStackVersion(dockerfileBody, stack);
      });
    }
    return dockerfileBody.replace(regexp, stack.selectedVersion);
  }
}
