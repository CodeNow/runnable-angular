'use strict';

require('app')
  .factory('updateDockerfileFromState', updateDockerfileFromState)
  .factory('populateDockerfile', populateDockerfile);

function updateDockerfileFromState(
  $q,
  fetchDockerfileFromSource,
  populateDockerfile,
  promisify
) {
  return function (state, shouldFetchSourceDockerfile, saveDockerfile) {
    if (!state.dockerfile) {
      return $q.reject(new Error('No destination dockerfile given'));
    }
    var promise = null;
    if (shouldFetchSourceDockerfile || !state.sourceDockerfile) {
      promise = fetchDockerfileFromSource(state.selectedStack.key)
        .then(function (sourceDockerfile) {
          state.sourceDockerfile = sourceDockerfile;
          return sourceDockerfile;
        });
    } else {
      promise = $q.when(state.sourceDockerfile);
    }

    return promise.then(function (sourceDockerfile) {
      return populateDockerfile(
        sourceDockerfile,
        state,
        state.dockerfile
      )
        .then(function (dockerfileBody) {
          if (saveDockerfile) {
            return promisify(state.dockerfile, 'update')({
              json: {
                body: dockerfileBody
              }
            });
          }
        });
    });
  };
}

function populateDockerfile(
  $q,
  regexpQuote,
  keypather,
  $log
) {
  return function (sourceDockerfile, state, destDockerfile) {
    if (!destDockerfile) {
      return Error('no destination dockerfile was given');
    }
    function replaceStackVersion(dockerfileBody, stack) {
      var regexp = new RegExp('<' + regexpQuote(stack.key.toLowerCase()) + '-version>', 'igm');
      if (stack.dependencies) {
        stack.dependencies.forEach(function (stack) {
          dockerfileBody = replaceStackVersion(dockerfileBody, stack);
        });
      }
      // This is basically just for Kissmetrics
      if (stack.key === 'ruby' && stack.selectedVersion) {
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
      if (typeof state.getPorts !== 'function') {
        var error = new Error('populateDockerfile requires a getPorts function');
        $log.error(error);
        return error;
      }
      // first, add the ports
      var ports = state.getPorts();
      var mainRepo = state.containerFiles.find(function (section) {
        return section.type === 'Main Repository';
      });

      mainRepo.hasFindReplace = (
        keypather.get(state, 'contextVersion.getMainAppCodeVersion().attrs.transformRules.rename.length') ||
        keypather.get(state, 'contextVersion.getMainAppCodeVersion().attrs.transformRules.replace.length') ||
        keypather.get(state, 'contextVersion.getMainAppCodeVersion().attrs.transformRules.exclude.length')
      );


      var dockerSectionArray = [];
      dockerSectionArray.push(keypather.get(state, 'packages'));
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
        .replace(/<dst>/gm, '/' + state.dst)
        .replace(/<start-command>/gm, state.startCommand)
        .replace(/#default.+/gm, ''); // Remove all default comments that are not

      if (ports.length) {
        dockerfileBody = dockerfileBody.replace(/<user-specified-ports>/gm, ports.join(' '));
      } else {
        dockerfileBody = dockerfileBody.replace('# Open up ports on the container\n', '');
        dockerfileBody = dockerfileBody.replace('EXPOSE <user-specified-ports>\n', '');
      }
      return dockerfileBody;
    }

    var dockerfileBody = populateDockerFile(sourceDockerfile.attrs.body);
    keypather.set(destDockerfile, 'state.isDirty', true);
    destDockerfile.state.body = dockerfileBody;
    return $q.when(dockerfileBody);
  };
}
