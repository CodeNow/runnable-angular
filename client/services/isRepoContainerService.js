'use strict';

require('app')
  .factory('isRepoContainerService', isRepoContainerService);
/**
 * @param {Instance} instance -  Instance model to search the appCodeVersions of
 * @returns {Function}
 */
function isRepoContainerService(
  keypather
) {
  return function (instance) {
    var appCodeVersions = keypather.get(instance, 'attrs.contextVersion.appCodeVersions');
    if (!appCodeVersions) {
      return false;
    }
    return !!appCodeVersions.find(function (appCodeVersion) {
      return !appCodeVersion.additionalRepo;
    });
  };
}