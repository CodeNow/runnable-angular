'use strict';

require('app')
  .factory('cleanStartCommand', cleanStartCommand);

function cleanStartCommand() {
  return function (command) {
    command = command || '';
    return command.replace('until grep -q ethwe /proc/net/dev; do sleep 1; done;', '');
  };
}
