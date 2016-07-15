'use strict';

require('app')
  .factory('getFirstDockStartedOrg', getFirstDockStartedOrg);

function getFirstDockStartedOrg(
  fetchWhitelistedOrgsForDockCreated,
  keypather
) {
  return function () {
    return fetchWhitelistedOrgsForDockCreated()
      .then(function (whitelistedOrgs) {
        return whitelistedOrgs.find(function (org) {
          return keypather.get(org, 'attrs.firstDockCreated');
        });
      });
  };
}
