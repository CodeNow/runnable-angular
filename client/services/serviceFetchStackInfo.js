'use strict';

require('app')
  .factory('fetchStackInfo', fetchStackInfo);

function fetchStackInfo(
  $q,
  $http,
  configAPIHost
) {
  var stacks;
  return function () {
    if (stacks) { return $q.when(stacks); }

    return $http.get(configAPIHost + '/actions/analyze/info')
      .then(function (data) {
        // we don't care about metadata
        data = data.data;
        stacks = [];
        Object.keys(data).forEach(function (key) {
          var stack = data[key];
          stack.key = key;
          stack.suggestedVersion = stack.defaultVersion;
          stacks.push(stack);
          if (stack.dependencies) {
            stack.dependencies = stack.dependencies.map(function (dep) {
              return data[dep];
            });
            if (stack.name == "Rails" && stack.dependencies[0].name == "Ruby") {
              console.log("PRANA ", stack);
              stack.dependencies[0].versions = stack.dependencies[0].versions.slice(2);
            }
          }
        });
        return stacks;
      });
  };
}
