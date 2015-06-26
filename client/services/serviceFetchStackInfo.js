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
              var depObject = angular.copy(data[dep]);
              if (dep === 'ruby') {
                // Fucking hacks.....
                ['1.8.6-p420', '1.8.7-p374'].forEach(function (thingThatDoesntBelong) {
                  var index = depObject.versions.indexOf(thingThatDoesntBelong);
                  if (index > -1) {
                    depObject.versions.splice(index, 1);
                  }
                });
              }
              return depObject;
            });
          }
        });
        return stacks;
      });
  };
}
