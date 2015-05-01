'use strict';

require('app')
  .filter('extractInstancePorts', filterExtractInstancePorts);

function filterExtractInstancePorts(extractInstancePorts) {
  return function (instance) {
    return extractInstancePorts(instance);
  };
}
