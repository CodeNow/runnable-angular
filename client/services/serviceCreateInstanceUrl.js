'use strict';

require('app')
  .factory('createInstanceUrl', createInstanceUrl);
/**
 * @param instance instance that was just changed
 * @param newName the new name the instance took
 * @param items [{ instance: {}, opts: { name, env } }]
 * @returns {*}
 */

/**
 * This goes through an instance and all of it's dependencies, changing any relevant env variables
 * with a new name.
 * @returns {Function}
 */
function createInstanceUrl(
  configUserContentDomain
) {
  return function (instance) {
    if (instance) {
      return instance.attrs.name + '-' +
        instance.attrs.owner.username + '.' + configUserContentDomain;
    }
  };
}
