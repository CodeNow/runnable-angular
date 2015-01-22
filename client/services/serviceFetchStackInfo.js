'use strict';

require('app')
  .factory('fetchStackInfo', fetchStackInfo);

function fetchStackInfo(
  user
) {
  return function (cb) {
    function callback(err, res, body) {
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
      cb(err, stacks);
    }

    user.client.get('/actions/analyze/info', callback);
  };
}