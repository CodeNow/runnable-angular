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
      if (/(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?/g.test(line)) {
        var result = {
          line: index + 1,
          url: line.split('=')[1]
        };
        if (line.toLowerCase().indexOf(
            ($state.params.userName + '.' + configUserContentDomain).toLowerCase()
          ) > -1) {
          linkMap[result] = true;
        } else {
          linkResults.other.push(result);
        }
      }
    });

    linkResults.servers = Object.keys(linkMap);
    return linkResults;
  };
}
