'use strict';

require('app')
  .factory('parseDockerfileForStack', parseDockerfileForStack);


require('app')
  .factory('parseDockerfileForStackFromInstance', parseDockerfileForStackFromInstance);

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
        stack = stackData.find(hasKeypaths({
          'key': stackKey
        }));
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

function parseDockerfileForStackFromInstance(
  parseDockerfileForStack,
  promisify
) {
  return function (instance, stackData) {
    return promisify(instance.contextVersion, 'fetchFile')('/Dockerfile')
      .then(function (dockerfile) {
        return parseDockerfileForStack(dockerfile, stackData);
      });
  };
}