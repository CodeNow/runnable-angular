'use strict';

require('app')
  .factory('getNewForkName', getNewForkName);

function getNewForkName() {
  return function (instanceName, instances, noCopy) {
    var newForkName = instanceName + (noCopy ? '' : '-copy');
    if (!instances || !instances.models.length) { return newForkName; }
    var numeral = 1;
    function checkInstanceName(instance) {
      var nameToCheck = (numeral > 1) ? newForkName + numeral : newForkName;
      return (instance.attrs.name.toLowerCase() === nameToCheck.toLowerCase());
    }
    while (instances.models.some(checkInstanceName)) {
      numeral += 1;
    }
    return (numeral > 1) ? newForkName + numeral : newForkName;
  };
}
