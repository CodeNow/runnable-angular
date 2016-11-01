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
  patchOrgMetadata,
  removePersonalRunnabot
) {
  var GIC = this;
  var org = keypather.get(currentOrg, 'github.attrs.login');
  GIC.organizationName = org;
  GIC.isPersonalAccount = keypather.get(currentOrg, 'poppa.attrs.isPersonalAccount');
  GIC.isRunnabotPersonalCollaborator = keypather.get(currentOrg, 'poppa.attrs.metadata.hasPersonalRunnabot');
  GIC.toggleRunnabotCollaborator = toggleRunnabotCollaborator;

  if (!GIC.isPersonalAccount) {
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

  function toggleRunnabotCollaborator () {
    var personalAccountName = keypather.get(currentOrg, 'poppa.attrs.name');
    if (GIC.isRunnabotPersonalCollaborator) {
      isRunnabotPersonalCollaborator(personalAccountName)
        .then(function (reposToInviteRunnabot) {
          invitePersonalRunnabot(reposToInviteRunnabot);
        })
        .then(function () {
          return patchOrgMetadata(currentOrg.poppa.id(), {
            metadata: {
              hasPersonalRunnabot: true
            }
          });
        })
        .then(function (updatedOrg) {
          keypather.set(currentOrg, 'poppa.attrs.metadata.hasPersonalRunnabot', true);
        })
        .catch(errs.handler);
    } else {
      removePersonalRunnabot(personalAccountName)
        .then(function () {
          return patchOrgMetadata(currentOrg.poppa.id(), {
            metadata: {
              hasPersonalRunnabot: false
            }
          });
        })
        .then(function (updatedOrg) {
          keypather.set(currentOrg, 'poppa.attrs.metadata.hasPersonalRunnabot', false);
        })
        .catch(errs.handler);
    }
  }

  $scope.$on('$destroy', function () {
    $interval.cancel(GIC.pollingInterval);
  });
}

