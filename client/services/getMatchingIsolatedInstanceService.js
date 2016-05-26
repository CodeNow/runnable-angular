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
function getMatchingIsolatedInstance() {
  return function (isolationModel, instanceMasterToMatch) {
    if (!isolationModel) {
      return;
    }
    return isolationModel.instances.models.find(function (dep) {
      return instanceMasterToMatch.attrs.contextVersion.context === dep.attrs.contextVersion.context;
    });
  };
}