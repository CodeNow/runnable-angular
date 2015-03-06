'use strict';

require('app')
  .factory('getTeamMemberClasses', getTeamMemberClasses);
/**
 * @njInject
 */
function getTeamMemberClasses(
  $stateParams,
  hasKeypaths
) {
  return function (teamMember) {
    if (!teamMember || !teamMember.instances || !teamMember.instances.length) {
      return {}; //async loading handling
    }
    var h = {};
    var instance = teamMember.instances.find(hasKeypaths({'attrs.name': $stateParams.instanceName}));
    h.active = !!(instance || teamMember.toggled);
    h.expanded = !!h.active;

    return h;
  };
}
