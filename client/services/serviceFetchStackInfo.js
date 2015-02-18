'use strict';

require('app')
  .factory('fetchStackInfo', fetchStackInfo);

function fetchStackInfo(
  $q,
  user
) {
  return function () {
    var d = $q.defer();
    function callback(err, res, body) {
      if (err) { return d.reject(err); }
      var stacks = [];
      Object.keys(body).forEach(function (key) {
        var stack = body[key];
        stack.key = key;
        stack.selectedVersion = stack.defaultVersion;
        stacks.push(stack);
        if (stack.dependencies) {
          stack.dependencies = stack.dependencies.map(function (dep) {
            return body[dep];
          });
        }
      });
      d.resolve(stacks);
    }
    user.client.get('/actions/analyze/info', callback);

    return d.promise;
  };
}