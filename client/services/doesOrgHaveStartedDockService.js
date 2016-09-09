'use strict';

require('app')
  .factory('doesOrgHaveStartedDock', doesOrgHaveStartedDock);

function doesOrgHaveStartedDock(
  eventTracking,
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
  eventTracking.visitedOrgSelectPage();
}
