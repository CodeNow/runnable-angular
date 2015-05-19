'use strict';

require('app')
  .factory('parseDockerfileForStack', parseDockerfileForStack);


require('app')
  .factory('parseDockerfileForDefaults', function () {
    return parseDockerfileForDefaults;
  });


require('app')
  .factory('parseDockerfileForCardInfoFromInstance', parseDockerfileForCardInfoFromInstance);

function parseDockerfileForStack(
  $log,
  hasKeypaths
) {
  return function (dockerfile, stackData) {
    if (stackData) {
      var fromValue = /from ([^\n]+)/i.exec(dockerfile.attrs.body);
      if (fromValue) {
        // it should be at index 1, since the full string is the 0th element
        var stack;
        var splitFrom = fromValue[1].split(':');
        var stackKey = splitFrom[0];
        var stackVersion = splitFrom.length > 1 ? splitFrom[1] : 'latest';
        var rubyVersion = null;

        if (stackKey === 'node') {
          stackKey = 'nodejs';
        } else if (stackKey === 'ruby') {
          // Check for RAILS_VERSION

          var railsVersion = /ENV RAILS_VERSION ([^\n]+)/.exec(dockerfile.attrs.body);
          if (railsVersion) {
            rubyVersion = stackVersion;
            stackKey = 'rails';
            stackVersion = railsVersion[1];
          }
        }
        stack = angular.copy(stackData.find(hasKeypaths({
          'key': stackKey
        })));
        if (stack) {
          stack.selectedVersion = stackVersion;
          if (rubyVersion) {
            stack.dependencies[0].selectedVersion = rubyVersion;
          }
          return stack;
        }
      }
    } else if (!stackData) {
      $log.warn('Stack data should not be empty!');
    }
  };
}

function parseDockerfileForDefaults(dockerfile, keys) {
  if (!Array.isArray(keys)) {
    keys = [keys];
  }
  var result = {};
  keys.forEach(function (key) {
    var regex = new RegExp('#default ' + key + ':([^\n]+)', 'gmi');
    var defaults;
    var totals = [];
    do {
      defaults = regex.exec(dockerfile.attrs.body);
      if (defaults && defaults[1]) {
        totals.push(defaults[1].trim());
      }
    } while (defaults);
    result[key] = totals;
  });

  return result;
}
function parseDockerfileForStartCommand(dockerfile) {
  var cmdValue = /cmd ([^\n]+)/i.exec(dockerfile.attrs.body);
  if (cmdValue) {
    return cmdValue[1];
  }
}

function parseDockerfileForPorts(dockerfile) {
  var portsValue = /expose ([^\n]+)/i.exec(dockerfile.attrs.body);
  if (portsValue) {
    return portsValue[1].replace(/expose/gi, '');
  }
}

function parseDockerfileForRunCommands(dockerfile, repoName) {
  // JS doesn't have easy lookbehind, so I just created two capturing groups.
  // The second group needs to be [\s\S] over . as that also matches newlines
  var reg = /(WORKDIR.*\n)([\s\S]*)(?=#End)/;
  var missingChunk;
  // Should be the beginning bit before any as the 1st, so remove it
  if (repoName) {
    var addChunks = dockerfile.attrs.body.split('ADD');
    addChunks.shift();
    missingChunk = addChunks.find(function (chunk) {
      return chunk.indexOf('./' + repoName.toLowerCase());
    });
  } else {
    missingChunk = dockerfile.attrs.body;
  }
  var results = reg.exec(missingChunk);
  if (results && results[2]) {
    return results[2].split('\n')
      .map(function (str) {
        return str.replace('RUN ', '')
          .replace(/#.+/, '')
          .trim(); //Remove all comments
      })
      .filter(function (command) {
        // filter out empties
        return command.length;
      })
      .join('\n');
  }
}

function parseDockerfileForContainerFiles(dockerfile) {
  var containerFiles = [];
  var reg = /#Add file: (.*)\n([\s\S]*)(?=#end file)/;
  var currentFile = reg.exec(dockerfile);
  while(currentFile) {
    containerFiles.push({
      name: currentFile[1],
      path: currentFile[2],
      commands: currentFile[3].split('\n').map(function (item) {
        return item.replace('RUN ');
      }),
      //FIXME
      type: 'File'
    });
    currentFile = reg.exec(dockerfile);
  }
  return containerFiles;
}


function parseDockerfileForCardInfoFromInstance(
  parseDockerfileForStack,
  promisify,
  $q
) {
  return function (instance, stackData) {
    return promisify(instance.contextVersion, 'fetchFile', true)('/Dockerfile')
      .then(function (dockerfile) {
        if (!dockerfile) {
          return $q.reject(new Error('Dockerfile empty or not found'));
        }
        return {
          instance: instance,
          ports: parseDockerfileForPorts(dockerfile),
          startCommand: parseDockerfileForStartCommand(dockerfile),
          commands: parseDockerfileForRunCommands(dockerfile, instance.getRepoName()),
          containerFiles: parseDockerfileForContainerFiles(dockerfile),
          selectedStack: parseDockerfileForStack(dockerfile, stackData)
        };
      });
  };
}
