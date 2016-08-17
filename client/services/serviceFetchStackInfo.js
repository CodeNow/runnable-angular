'use strict';

require('app')
  .factory('fetchStackInfo', fetchStackInfo);

function fetchStackInfo(
  $http,
  configAPIHost
) {
  var stacksPromise;
  return function () {
    if (!stacksPromise) {
      stacksPromise = $http.get(configAPIHost + '/actions/analyze/info')
        .then(function (data) {
          // we don't care about metadata
          data = data.data;
          var stacks = [];
          Object.keys(data).forEach(function (key) {
            var stack = data[key];
            stack.key = key;
            stack.suggestedVersion = stack.defaultVersion;
            stacks.push(stack);
            if (stack.dependencies) {
              stack.dependencies = stack.dependencies.map(function (dep) {
                var depObject = angular.copy(data[dep]);
                depObject.key = dep;
                depObject.suggestedVersion = depObject.defaultVersion;
                return depObject;
              });
            }
          });
          return stacks;
        });
    }
    return stacksPromise;
  };
}
