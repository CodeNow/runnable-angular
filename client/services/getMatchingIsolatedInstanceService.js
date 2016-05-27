'use strict';

require('app')
  .factory('getMatchingIsolatedInstance', getMatchingIsolatedInstance);
/**
 * @param {Isolation} isolationModel -  isolation object from the instance model that describes the
 *                                        group
 * @param {Isolation} instanceToMatch - instance that matches the contextId of the isolation we're looking
 *                                        for
 * @returns {Function}
 */
function getMatchingIsolatedInstance(
  keypather
) {
  return function (isolationModel, instanceMasterToMatch) {
    if (!keypather.get(isolationModel, 'instances.models.length')) {
      return;
    }
    return isolationModel.instances.models.find(function (dep) {
      return keypather.get(instanceMasterToMatch, 'attrs.contextVersion.context') ===
        keypather.get(dep, 'attrs.contextVersion.context');
    });
  };
}