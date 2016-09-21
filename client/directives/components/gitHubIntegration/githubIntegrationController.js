'use strict';

require('app')
  .controller('GithubIntegrationController', GithubIntegrationController);
/**
 * @ngInject
 */
function GithubIntegrationController(
  $interval,
  $q,
  $rootScope,
  $scope,
  ahaGuide,
  currentOrg,
  errs,
  fetchGithubUserIsAdminOfOrg,
  isRunnabotPartOfOrg,
  keypather,
  loading
) {
  var GIC = this;
  var org = keypather.get(currentOrg, 'github.attrs.login');
  GIC.organizationName = org;

  function checkRunnabot() {
    return isRunnabotPartOfOrg(org)
      .then(function (hasRunnabot) {
        GIC.hasRunnabot = hasRunnabot;
        if (hasRunnabot) {
          if (GIC.pollingInterval) {
            $interval.cancel(GIC.pollingInterval);
          }
          return ahaGuide.hasRunnabot();
        }
      })
      .catch(errs.handler);
  }

  loading.reset('checkRunnabot');
  loading('checkRunnabot', true);
  $q.all({
    isAdmin: fetchGithubUserIsAdminOfOrg(org),
    hasRunnabot: checkRunnabot()
  })
    .then(function (results) {
      GIC.isAdmin = results.isAdmin;
    })
    .catch(errs.handler)
    .finally(function () {
      loading('checkRunnabot', false);
    });

  GIC.pollCheckRunnabot = function () {
    GIC.pollingInterval = $interval(checkRunnabot, 2000);
  };

  $scope.$on('$destroy', function () {
    $interval.cancel(GIC.pollingInterval);
  });
}

