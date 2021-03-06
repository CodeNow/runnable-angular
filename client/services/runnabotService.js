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
        var runnabotChecks = instances.filter(function (instance) {
          return instance.attrs.masterPod && instance.contextVersion.getMainAppCodeVersion();
        })
        .map(function (instance) {
          var repoName = instance.getRepoName();
          return githubRunnabotCheck(userName, repoName);
        });
        return $q.all(runnabotChecks);
      });
  };

  function githubRunnabotCheck (githubUsername, repoName) {
    var req = {
      method: 'get',
      url:  'https://api.github.com/repos/' + githubUsername + '/' + repoName + '/collaborators/runnabot'
    };

    return github.makeGhRequest(req)
      .then(function (response) {
        // if runnabot is already a contributor there is no response body
        return {
          isRunnabotPersonalCollaborator: true
        };
      })
      .catch(function (err) {
        if (err.message === 'Not Found') {
          return {
            githubUsername: githubUsername,
            isRunnabotPersonalCollaborator: false,
            repoName: repoName
          };
        }
        return $q.reject(err);
      });
  }
}

function invitePersonalRunnabot(
  $q,
  github
) {
  return function (repos) {
    if (!Array.isArray(repos)) {
      repos = [ repos ];
    }
    var runnabotInvites = repos.filter(function (repo) {
      if (repo) {
        var req = {
          method: 'put',
          url:  'https://api.github.com/repos/' + repo.githubUsername + '/' + repo.repoName + '/collaborators/runnabot'
        };
        return github.makeGhRequest(req);
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
        var req;
        var repoName;
        var repoCalls = instances.filter(function (instance) {
          return instance.attrs.masterPod && instance.contextVersion.getMainAppCodeVersion();
        })
        .map(function (instance) {
          repoName = instance.getRepoName();
          req = {
            method: 'delete',
            url:  'https://api.github.com/repos/' + userName + '/' + repoName + '/collaborators/runnabot'
          };
          return github.makeGhRequest(req);
        });
        return $q.all(repoCalls);
      });
  };
}
