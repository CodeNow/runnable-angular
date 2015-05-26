'use strict';

require('app')
  .factory('findLinkedServerVariables', findLinkedServerVariables);


function findLinkedServerVariables($state, configUserContentDomain) {
  return function (input) {
    if (typeof input === 'string') {
      input = input.split('\n');
    } else if (!Array.isArray(input)) {
      return {};
    }

    var linkResults = {
      servers: [],
      other: []
    };
    var linkMap = {};
    input.forEach(function (line, index) {
      if (/=[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?/ig.test(line)) {
        var result = {
          line: index + 1,
          url: line.split('=')[1]
        };
        if (line.toLowerCase().indexOf(
            ($state.params.userName + '.' + configUserContentDomain).toLowerCase()
          ) > -1) {
          linkMap[result.url] = result;
        } else {
          linkResults.other.push(result);
        }
      }
    });

    linkResults.servers = Object.keys(linkMap).map(function(key) {
      return linkMap[key];
    });
    return linkResults;
  };
}
