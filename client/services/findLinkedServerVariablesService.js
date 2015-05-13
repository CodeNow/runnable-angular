'use strict';

require('app')
  .factory('findLinkedServerVariables', findLinkedServerVariables);


function findLinkedServerVariables($state, configUserContentDomain) {
  return function (input) {
    var urlRegex = /(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?/g;
    if (typeof input === 'string') {
      input = input.split('\n');
    } else if (!Array.isArray(input)) {
      return {};
    }

    var linkResults = {
      servers: [],
      other: []
    };
    input.forEach(function (line, index) {
      var check = urlRegex.test(line);
      if (check) {
        var result = {
          line: index + 1,
          url: line.split('=')[1]
        };
        if (line.toLowerCase().indexOf(
            ($state.params.userName + '.' + configUserContentDomain).toLowerCase()
          ) > -1) {
          linkResults.servers.push(result);
        } else {
          linkResults.other.push(result);
        }
      }
    });
    return linkResults;
  };
}
