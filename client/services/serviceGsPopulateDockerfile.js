'use strict';

require('app')
  .factory('gsPopulateDockerfile', gsPopulateDockerfile);

function gsPopulateDockerfile(
  regexpQuote
) {
  return function (dockerfile, state) {
    function populateDockerFile(dockerfileBody) {
      // first, add the ports
      Object.keys(state.version).forEach(function(stackName) {
        var regexp = new RegExp('<' + regexpQuote(stackName.toLowerCase()) + '-version>', 'gm');
        console.log('replacing version', stackName, regexp, state.version[stackName]);
        dockerfileBody = dockerfileBody.replace(regexp, state.version[stackName]);
      });
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
}
