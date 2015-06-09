'use strict';

require('app')
  .factory('parseDockerfileForStack', parseDockerfileForStack)
  .factory('parseDockerfileForCardInfoFromInstance', parseDockerfileForCardInfoFromInstance)
  .factory('parseDockerfileForDefaults', function () {
    return parseDockerfileForDefaults;
  });

function parseDockerfileForStack(
  $log,
  hasKeypaths
) {
  return function (dockerfile, stackData) {
    if (!stackData) {
      return $log.warn('Stack data should not be empty!');
    }

    var fromValue = /from ([^\n]+)/i.exec(dockerfile.attrs.body);
    if (!fromValue) {
      return $log.warn('FROM value not found');
    }
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
  var cmdValue = /cmd ([^\n]+)/i.exec(dockerfile);
  if (cmdValue) {
    return cmdValue[1];
  }
}

function parseDockerfileForPorts(dockerfile) {
  var portsValue = /expose ([^\n]+)/i.exec(dockerfile);
  if (portsValue) {
    return portsValue[1].replace(/expose/gi, '');
  }
}

function parseDockerfileForCardInfoFromInstance(
  parseDockerfileForStack,
  promisify,
  keypather,
  $q,
  $log,
  errs,
  fetchCommitData,
  cardInfoTypes,
  fetchStackInfo
) {

  function parseDockerfile (dockerfile) {
    var regex = new RegExp('#Start: (.*)\n([\\s\\S]*?)#End', 'gm');
    var currentBlock = regex.exec(dockerfile);
    var chunks = [];

    var CustomType;
    var content;
    while (currentBlock) {
      CustomType = cardInfoTypes[currentBlock[1]];
      content = currentBlock[2];
      if (CustomType) {
        var newChunk = new CustomType(content);
        if (newChunk.legacyAdd && currentBlock[1] === 'File') {
          errs.handler('ADD command not in array syntax, please remove and reupload file');
        }
        chunks.push(newChunk);
      } else {
        $log.error('Type "' + currentBlock[1] + '" not found.');
      }
      currentBlock = regex.exec(dockerfile);
    }

    return chunks;
  }

  return function (instance) {
    return $q.all({
      dockerfile: promisify(instance.contextVersion, 'fetchFile', true)('/Dockerfile'),
      stacks: fetchStackInfo()
    })
      .then(function (data) {
        var dockerfile = data.dockerfile;
        var dockerfileBody = keypather.get(dockerfile, 'attrs.body');
        if (!dockerfileBody) {
          return $q.reject(new Error('Dockerfile empty or not found'));
        }

        var containerFiles = parseDockerfile(dockerfileBody).filter(function (section) {
          return ['File', 'Repository', 'Main Repository'].indexOf(section.type) !== -1;
        });

        var acvs = keypather.get(instance, 'build.contextVersions.models[0].appCodeVersions');
        var mainCommands = '';
        containerFiles = containerFiles.map(function (item) {
          if (item.type === 'File') { return item; }
          var matchingAcv = acvs.models.find(function (acv) {
            return acv.attrs.repo.split('/')[1] === item.name;
          });
          if (item.type === 'Main Repository') {
            mainCommands = item.commands;
          }
          if (matchingAcv) {
            item.acv = matchingAcv;
            item.repo = matchingAcv.githubRepo;
            item.branch = fetchCommitData.activeBranch(matchingAcv);
            item.commit = fetchCommitData.activeCommit(matchingAcv);
            fetchCommitData.branchCommits(item.branch);
          }
          return item;
        });

        return {
          instance: instance,
          ports: parseDockerfileForPorts(dockerfileBody),
          startCommand: parseDockerfileForStartCommand(dockerfileBody),
          commands: mainCommands,
          containerFiles: containerFiles,
          selectedStack: parseDockerfileForStack(dockerfile, data.stacks)
        };
      });
  };
}
