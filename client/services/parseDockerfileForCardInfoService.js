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

function wrapWithType(content, type){
  return '#Start ' + type + '\n' +
    content + '\n' +
    '#End';
}


function ContainerFile(contents){
  var commandList = contents.split('\n');
  var commands = /^ADD ((?:\\\s|[^\s])*) ((?:\\\s|[^\s])*)/.exec(commandList[0]);

  this.name = commands[1].replace('./');
  this.path = commands[2];
  this.commands = commandList.splice(0,1).map(function (item) {
    return item.replace('RUN ');
  });
  this.type = 'File';

  this.toString = function () {
    var contents = 'ADD ./' + this.name + ' ' + this.path + '\n'+
      this.commands
        .filter(function (command) {
          return command.trim().length;
        })
        .map(function (command) {
          return 'RUN '+command;
        })
        .join('\n');
    return wrapWithType(contents, this.type);
  };
}

//function ContainerRepo(contents){
//
//}


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
  'Container File': ContainerFile
  //'Ports': Ports,
  //'Start Command': StartCommand
};

function parseDockerfile (dockerfile) {
  var regex = /#Start: (.*)\n([\s\S]*?)#End/g;
  var currentBlock = regex.exec(dockerfile);
  var chunks = [];

  var CustomType;
  var content;
  while (currentBlock) {
    CustomType = types[currentBlock[1]];
    content = currentBlock[2];
    if (CustomType) {
      chunks.push( new CustomType(content) );
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
  $q
) {
  return function (instance, stackData) {
    return promisify(instance.contextVersion, 'fetchFile', true)('/Dockerfile')
      .then(function (dockerfile) {
        if (!dockerfile) {
          return $q.reject(new Error('Dockerfile empty or not found'));
        }

        var allSections = parseDockerfile(dockerfile);
        function findByType(type){
          return allSections.find(function (section) {
            return section.type === type;
          });
        }

        var containerFiles = findByType('Container File');
        // BLARG
        // IF YOU SEE THIS COMMENT, RANDALL FORGOT TO REMOVE THISq
        containerFiles = [{
            name: 'a',
            path: '/asdf',
            type: 'file',
            commands: ['EAT food']
        }, {
            name: 'repo',
            path: '/repo',
            type: 'mainrepo'
        }, {
            name: 'otherrepo',
            path: '/otherrepo',
            type: 'repo',
            commands: ['LOAD datums', 'FORGET datums']
        }, {
            name: 'b',
            path: '/zxcv',
            type: 'file'
        }];
        return {
          allSections: allSections,
          instance: instance,
          ports: parseDockerfileForPorts(dockerfile),
          startCommand: parseDockerfileForStartCommand(dockerfile),
          commands: parseDockerfileForRunCommands(dockerfile, instance.getRepoName()),
          containerFiles: containerFiles,
          selectedStack: parseDockerfileForStack(dockerfile, stackData)
        };
      });
  };
}
