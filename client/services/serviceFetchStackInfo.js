'use strict';

require('app')
  .factory('fetchStackInfo', fetchStackInfo);

/**
 * @name fetchStackInfo
 * @alias fetchStackInfo
 * @param $q
 * @param user
 * @returns {Function}
 */
function fetchStackInfo(
  $q,
  user
) {
  var stacks;
  return function () {
    return $q(function (resolve, reject) {
      if (stacks) { return resolve(stacks); }

      user.client.get('/actions/analyze/info', function callback(err, res, body) {
        if (err) { return reject(err); }
        stacks = [];
        Object.keys(body).forEach(function (key) {
          var stack = body[key];
          stack.key = key;
          stack.suggestedVersion = stack.defaultVersion;
          stacks.push(stack);
          if (stack.dependencies) {
            stack.dependencies = stack.dependencies.map(function (dep) {
              return body[dep];
            });
          }
        });
        resolve(stacks);
      });
    });
  };
}