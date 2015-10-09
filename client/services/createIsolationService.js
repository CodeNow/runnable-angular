'use strict';

require('app')
  .factory('createIsolation', createIsolation);

function createIsolation(
  fetchUser,
  promisify
) {
  return function (instance, children) {
    return fetchUser().then(function (user) {
      return promisify(user, 'createIsolation')({
        master: instance.id(),
        children: children
      });
    });
  };
}
