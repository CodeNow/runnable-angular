'use strict';

require('app')
  .factory('isRunnabotPartOfOrg', isRunnabotPartOfOrg)
  .factory('invitePersonalRunnabot', invitePersonalRunnabot)
  .factory('isRunnabotPersonalCollaborator', isRunnabotPersonalCollaborator)
  .factory('removePersonalRunnabot', removePersonalRunnabot);

function isRunnabotPartOfOrg(
  $http,
  configAPIHost
) {
  return function (orgName) {
    return $http({
      method: 'get',
      url: configAPIHost + '/github/orgs/' + orgName + '/memberships/runnabot'
    })
      .then(function (data) {
        return data.status < 400;  // Github returns 404 when the user isn't part of the org
      })
      .catch(function () {
        return false;
      });
  };
}

function isRunnabotPersonalCollaborator (
  $q,
  fetchInstances,
  github
) {
  return function (userName) {
    return fetchInstances()
      .then(function (instances) {
        var repoCalls = instances.map(function (instance) {
          var repoName = instance.getRepoName();
          return github.isPersonalRunnabot(userName, repoName);
        });
        return $q.all(repoCalls);
      });
  };
}

function invitePersonalRunnabot(
  $q,
  github
) {
  return function (repos) {
    var runnabotInvites = repos.filter(function (repo) {
      if (repo) {
        return github.inviteRunnabotAsCollaborator(repo.githubUsername, repo.repoName);
      }
    });
    return $q.all(runnabotInvites);
  };
}

function removePersonalRunnabot(
  $q,
  fetchInstances,
  github
) {
  return function (userName) {
    return fetchInstances()
      .then(function (instances) {
        var repoCalls = instances.map(function (instance) {
          var repoName = instance.getRepoName();
          return github.removeRunnabotAsCollaborator(userName, repoName);
        });
        return $q.all(repoCalls);
      });
  };
}
