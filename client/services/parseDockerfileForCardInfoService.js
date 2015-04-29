'use strict';

require('app')
  .factory('parseDockerfileForStack', parseDockerfileForStack);


require('app')
  .factory('parseDockerfileForCardInfoFromInstance', parseDockerfileForCardInfoFromInstance);

function parseDockerfileForStack(
  $log,
  hasKeypaths
) {
  return function (dockerfile, stackData) {
    if (dockerfile && stackData) {
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

function parseDockerfileForStartCommand(dockerfile) {
  if (dockerfile) {
    var cmdValue = /cmd ([^\n]+)/i.exec(dockerfile.attrs.body);
    if (cmdValue) {
      return cmdValue[1];
    }
  }
}

function parseDockerfileForPorts(dockerfile) {
  if (dockerfile) {
    var portsValue = /expose ([^\n]+)/i.exec(dockerfile.attrs.body);
    if (portsValue) {
      return portsValue[1].replace(/expose/gi, '');
    }
  }
}

function parseDockerfileForCardInfoFromInstance(
  parseDockerfileForStack,
  promisify
) {
  return function (instance, stackData) {
    var server = {
      instance: instance
    };
    return promisify(instance.contextVersion, 'fetchFile')('/Dockerfile')
      .then(function (dockerfile) {
        server.ports = parseDockerfileForPorts(dockerfile);
        server.startCommand = parseDockerfileForStartCommand(dockerfile);
        return parseDockerfileForStack(dockerfile, stackData);
      })
      .then(function (stack) {
        server.selectedStack = stack;
        return server;
      })
      .catch(angular.noop);
  };
}
