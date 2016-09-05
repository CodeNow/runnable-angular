'use strict';

require('app')
  .controller('GithubIntegrationController', GithubIntegrationController);
/**
 * @ngInject
 */
function GithubIntegrationController(
  addRunnabotToGithubOrg,
  currentOrg,
  errs,
  fetchGithubUserIsAdminOfOrg,
  isRunnabotPartOfOrg,
  keypather,
  loading
) {
  var GIC = this;
  var org = keypather.get(currentOrg, 'github.attrs.login');

  fetchGithubUserIsAdminOfOrg(org)
    .then(function (isAdmin) {
      GIC.isAdmin = isAdmin;
    })
    .catch(errs.handler);

  isRunnabotPartOfOrg(org)
    .then(function (hasRunnabot) {
      GIC.hasRunnabot = hasRunnabot;
      if (!hasRunnabot) {
        isRunnabotPartOfOrg.cache.clear();
      }
    })
    .catch(errs.handler);

  GIC.addRunnabot = function () {
    loading('addRunnabot', true);
    return addRunnabotToGithubOrg(org)
      .catch(errs.handler)
      .finally(function () {
        loading('addRunnabot');
        isRunnabotPartOfOrg.cache.clear();
      });
  };
}

