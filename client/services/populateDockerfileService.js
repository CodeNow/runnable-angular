'use strict';

require('app')
  .factory('populateDockerfile', populateDockerfile);

function populateDockerfile(
  promisify,
  regexpQuote,
  keypather,
  configEnvironment,
  $log
) {
  return function (sourceDockerfile, state, destDockerfile) {
    function replaceStackVersion(dockerfileBody, stack) {
      var regexp = new RegExp('<' + regexpQuote(stack.key.toLowerCase()) + '-version>', 'igm');
      if (stack.dependencies) {
        stack.dependencies.forEach(function (stack) {
          dockerfileBody = replaceStackVersion(dockerfileBody, stack);
        });
      }
      // This is basically just for Kissmetrics
      if (stack.key === 'ruby') {
        var versionBroken = stack.selectedVersion.split('.');
        var normalVersion = stack.selectedVersion;
        if (versionBroken.length > 1 && versionBroken[0] === '1' && parseInt(versionBroken[1]) < 9) {
          normalVersion = '1.9';
        }
        dockerfileBody = dockerfileBody.replace('<ruby-major>', versionBroken[0] + '.' + versionBroken[1]);
        dockerfileBody = dockerfileBody.replace('<ruby-version-normalized>', normalVersion);
      }
      return dockerfileBody.replace(regexp, stack.selectedVersion);
    }
    function populateDockerFile(dockerfileBody) {
      // first, add the ports
      var ports = state.ports.join(' ');
      var mainRepo = state.containerFiles.find(function (section) {
        return section.type === 'Main Repository';
      });

      if (
        keypather.get(state, 'contextVersion.getMainAppCodeVersion().attrs.transformRules.rename.length') ||
        keypather.get(state, 'contextVersion.getMainAppCodeVersion().attrs.transformRules.replace.length') ||
        keypather.get(state, 'contextVersion.getMainAppCodeVersion().attrs.transformRules.exclude.length')
      ) {
        mainRepo.hasFindReplace = true;
      }


      var dockerSectionArray = [];
      var containerFiles = keypather.get(state, 'containerFiles') || [];
      dockerSectionArray = dockerSectionArray.concat(containerFiles);

      var dockerSectionsString = '\n' + dockerSectionArray.join('\n\n') + '\n';

      if (mainRepo) {
        dockerSectionsString += '\nWORKDIR /'+mainRepo.path+'\n';
      }

      dockerfileBody = replaceStackVersion(dockerfileBody, state.selectedStack);

      var beforeIndex = dockerfileBody.indexOf('<before-main-repo>');
      var afterIndex = dockerfileBody.indexOf('<after-main-repo>');

      dockerfileBody = dockerfileBody.slice(0, beforeIndex) + dockerSectionsString + dockerfileBody.slice(afterIndex + '<after-main-repo>'.length);

      dockerfileBody = dockerfileBody
        .replace(/<user-specified-ports>/gm, ports)
        .replace(/<dst>/gm, '/' + state.dst)
        .replace(/<start-command>/gm, state.startCommand)
        .replace(/#default.+/gm, ''); // Remove all default comments that are not

      if (!state.ports.length) {
        dockerfileBody = dockerfileBody.replace('EXPOSE', '');
      }
      if (configEnvironment !== 'production') {
        $log.log('Generated dockerfile \n', dockerfileBody);
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
