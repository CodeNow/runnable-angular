'use strict';

require('app')
  .controller('GithubIntegrationController', GithubIntegrationController);
/**
 * @ngInject
 */
function GithubIntegrationController(
  $interval,
  $q,
  $scope,
  ahaGuide,
  currentOrg,
  errs,
  fetchGithubUserIsAdminOfOrg,
  isRunnabotPartOfOrg,
  isRunnabotPersonalCollaborator,
  invitePersonalRunnabot,
  keypather,
  loading,
  removePersonalRunnabot
) {
  var GIC = this;
  var org = keypather.get(currentOrg, 'github.attrs.login');
  GIC.organizationName = org;
  GIC.isPersonalAccount = keypather.get(currentOrg, 'poppa.attrs.isPersonalAccount');
  GIC.checkPersonalRunnabot = checkPersonalRunnabot;
  GIC.toggleRunnabotCollaborator = toggleRunnabotCollaborator;

  if (GIC.isPersonalAccount) {
    checkPersonalRunnabot();
  } else {
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
  }


  GIC.pollCheckRunnabot = function () {
    GIC.pollingInterval = $interval(checkRunnabot, 2000);
  };

  function checkRunnabot () {
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

  function checkPersonalRunnabot () {
    var personalAccountName = keypather.get(currentOrg, 'poppa.attrs.name');
    loading.reset('checkPersonalRunnabot');
    loading('checkPersonalRunnabot', true);
    isRunnabotPersonalCollaborator(personalAccountName)
      .then(function (userInstanceRepos) {
        var runnabotNotInvited = userInstanceRepos.filter(function (repo) {
          return repo;
        });
        loading('checkPersonalRunnabot', false);
        if (runnabotNotInvited.length) {
          GIC.isRunnabotPersonalCollaborator = false;
        } else {
          GIC.isRunnabotPersonalCollaborator = true;
        }
      })
      .catch(errs.handler);
  }

  function toggleRunnabotCollaborator () {
    var personalAccountName = keypather.get(currentOrg, 'poppa.attrs.name');
    if (GIC.isRunnabotPersonalCollaborator) {
      isRunnabotPersonalCollaborator(personalAccountName)
        .then(function (reposToInviteRunnabot) {
          return invitePersonalRunnabot(reposToInviteRunnabot);
        })
        .catch(errs.handler);
    } else {
      removePersonalRunnabot(personalAccountName)
      .catch(errs.handler);
    }
  }

  $scope.$on('$destroy', function () {
    $interval.cancel(GIC.pollingInterval);
  });
}

