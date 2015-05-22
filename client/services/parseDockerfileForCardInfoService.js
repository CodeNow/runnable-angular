'use strict';

require('app')
  .factory('parseDockerfileForStack', parseDockerfileForStack);


require('app')
  .factory('parseDockerfileForDefaults', function () {
    return parseDockerfileForDefaults;
  });


require('app')
  .factory('parseDockerfileForCardInfoFromInstance', parseDockerfileForCardInfoFromInstance);

require('app')
  .factory('cardInfoTypes', getCardInfoTypes);

function parseDockerfileForStack(
  $log,
  hasKeypaths
) {
  return function (dockerfile, stackData) {
    if (stackData) {
      var fromValue = /from ([^\n]+)/i.exec(dockerfile);
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

          var railsVersion = /ENV RAILS_VERSION ([^\n]+)/.exec(dockerfile);
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

function parseDockerfileForRunCommands(dockerfile, repoName) {
  // JS doesn't have easy lookbehind, so I just created two capturing groups.
  // The second group needs to be [\s\S] over . as that also matches newlines
  var reg = /(WORKDIR.*\n)([\s\S]*)(?=#End)/;
  var missingChunk;
  // Should be the beginning bit before any as the 1st, so remove it
  if (repoName) {
    var addChunks = dockerfile.split('ADD');
    addChunks.shift();
    missingChunk = addChunks.find(function (chunk) {
      return chunk.indexOf('./' + repoName.toLowerCase());
    });
  } else {
    missingChunk = dockerfile;
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

function wrapWithType(content, type){
  return '#Start: ' + type + '\n' +
    content + '\n' +
    '#End';
}


function ContainerFile(contents){
  this.type = 'Container File';

  if (contents) {
    var commandList = contents.split('\n');
    var commands = /^ADD ((?:\\\s|[^\s])*) ((?:\\\s|[^\s])*)/.exec(commandList[0]);

    this.name = commands[1].replace('./', '');
    this.path = commands[2].replace('/', '');
    this.commands = commandList.splice(0,1).map(function (item) {
      return item.replace('RUN ');
    }).join('\n');
  }

  var self = this;
  this.toString = function () {
    self.commands = self.commands || '';
    var contents = 'ADD ./' + self.name.trim() + ' /' + self.path.trim() + '\n'+
      self.commands
        .split('\n')
        .filter(function (command) {
          return command.trim().length;
        })
        .map(function (command) {
          return 'RUN '+command;
        })
        .join('\n');
    return wrapWithType(contents, self.type);
  };
}

function Repo(contents, main){
  this.type = main ? 'Main Repo' : 'Repo';
  if (contents) {
    var commandList = contents.split('\n');
    var commands = /^ADD ((?:\\\s|[^\s])*) ((?:\\\s|[^\s])*)/.exec(commandList[0]);
    this.name = commands[1].replace('./', '');
    this.path = commands[2].replace('/', '');
    commandList.splice(0,1);
    this.commands = commandList.map(function (item) {
      return item.replace('RUN ', '');
    }).join('\n');
  }

  var self = this;
  this.toString = function () {
    self.commands = self.commands || '';
    var contents = 'ADD ./' + self.name.trim() + ' /' + self.path.trim() + '\n'+
      self.commands
        .split('\n')
        .filter(function (command) {
          return command.trim().length;
        })
        .map(function (command) {
          return 'RUN '+command;
        })
        .join('\n');
    return wrapWithType(contents, self.type);
  };
}


// TODO: Make container repo distinct from main repo
// Possibly just different types, same func

// TODO: put datums back in dockerfile on save


//function Ports(contents){
//  contents = contents || '';
//  this.ports = contents.replace('expose ').split(' ');
//  this.type = 'Ports';
//  this.toString = function () {
//    return wrapWithType(this.ports.join(' '), this.type);
//  };
//}
//
//function StartCommand(contents){
//  this.command = contents.replace('CMD ');
//  this.type = 'Start Command';
//  this.toString = function () {
//    return wrapWithType(this.type, 'CMD ' + this.command);
//  };
//}

var types = {
  'Container File': ContainerFile,
  'Main Repo': Repo,
  'Repo': Repo
};


function getCardInfoTypes() {
  return function () {
    return types;
  };
}

function parseDockerfile (dockerfile) {
  var regex = new RegExp('#Start: (.*)\n([\\s\\S]*?)#End', 'gm');
  var currentBlock = regex.exec(dockerfile);
  var chunks = [];

  var CustomType;
  var content;
  while (currentBlock) {
    CustomType = types[currentBlock[1]];
    content = currentBlock[2];
    if (CustomType) {
      var isMainRepo = currentBlock === 'Main Repo';
      chunks.push( new CustomType(content, isMainRepo) );
    } else {
      console.log('Type "' + currentBlock[1] + '" not found.');
    }
    currentBlock = regex.exec(dockerfile);
  }

  return chunks;
}



function parseDockerfileForCardInfoFromInstance(
  parseDockerfileForStack,
  promisify,
  keypather,
  hasKeypaths,
  $q
) {
  return function (instance, stackData) {
    return promisify(instance.contextVersion, 'fetchFile', true)('/Dockerfile')
      .then(function (dockerfile) {
        var dockerfileBody = keypather.get(dockerfile, 'attrs.body');
        if (!dockerfileBody) {
          return $q.reject(new Error('Dockerfile empty or not found'));
        }
        var allSections = parseDockerfile(dockerfileBody);

        var containerFiles = allSections.filter(function (section) {
          return ['Container File', 'Repo', 'Main Repo'].indexOf(section.type) !== -1;
        });

        var acvs = keypather.get(instance, 'build.contextVersions.models[0].appCodeVersions');
        containerFiles = containerFiles.map(function (item) {
          if (item.type === 'file') { return item; }
          var matchingAcv = acvs.models.find(hasKeypaths({
            'attrs.repo': item.name
          }));
          if (matchingAcv) {
            item.acv = matchingAcv;
          }
          return item;
        });
        return {
          allSections: allSections,
          instance: instance,
          ports: parseDockerfileForPorts(dockerfileBody),
          startCommand: parseDockerfileForStartCommand(dockerfileBody),
          commands: parseDockerfileForRunCommands(dockerfileBody, instance.getRepoName()),
          containerFiles: containerFiles,
          selectedStack: parseDockerfileForStack(dockerfile, stackData)
        };
      });
  };
}
