require('app')
  .factory('determineActiveAccount', determineActiveAccount);
/**
 * @ngInject
 */
function determineActiveAccount (
  hasKeypaths
) {
  return function (
    currentUserOrOrgName,
    orgs,
    thisUser
  ) {
    if (!currentUserOrOrgName || currentUserOrOrgName === thisUser.oauthName()) {
      return thisUser;
    }
    var currentOrg = orgs.find(hasKeypaths({
      'attrs.login.toLowerCase()': currentUserOrOrgName.toLowerCase()
    }));
    return currentOrg;
  };
}
