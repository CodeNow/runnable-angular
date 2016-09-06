'use strict';

require('app')
  .controller('GithubIntegrationController', GithubIntegrationController);
/**
 * @ngInject
 */
function GithubIntegrationController(
  $scope,
  $interval,
  currentOrg,
  errs,
  fetchGithubUserIsAdminOfOrg,
  isRunnabotPartOfOrg,
  keypather
) {
  var GIC = this;
  var org = keypather.get(currentOrg, 'github.attrs.login');
  GIC.organizationName = org;

  fetchGithubUserIsAdminOfOrg(org)
    .then(function (isAdmin) {
      GIC.isAdmin = isAdmin;
    })
    .catch(errs.handler);

  function checkRunnabot() {
    isRunnabotPartOfOrg(org)
      .then(function (hasRunnabot) {
        GIC.hasRunnabot = hasRunnabot;
        if (hasRunnabot && GIC.pollingInterval) {
          $interval.cancel(GIC.pollingInterval);
        }
      })
      .catch(function (err) {
        errs.handler(err);
      });
  }
  checkRunnabot();

  GIC.pollCheckRunnabot = function () {
    GIC.pollingInterval = $interval(checkRunnabot, 2000);
  };

  $scope.$on('$destroy', function () {
    $interval.cancel(GIC.pollingInterval);
  });
}

