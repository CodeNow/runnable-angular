'use strict';
var jsonHash = require('json-hash');

require('app')
  .factory('fetchUser', fetchUser)
  .factory('fetchOrgs', fetchOrgs)
  .factory('fetchInstances', fetchInstances)
  .factory('fetchBuild', fetchBuild)
  .factory('fetchOwnerRepos', fetchOwnerRepos)
  .factory('fetchRepoBranches', fetchRepoBranches)
  .factory('fetchContexts', fetchContexts)
  .factory('fetchSettings', fetchSettings)
  .factory('fetchSlackMembers', fetchSlackMembers)
  .factory('fetchGitHubMembers', fetchGitHubMembers)
  .factory('fetchGitHubUser', fetchGitHubUser)
  .factory('integrationsCache', integrationsCache)
  .factory('fetchPullRequest', fetchPullRequest)
  .factory('fetchInstancesByPod', fetchInstancesByPod);

function fetchUser(
  keypather,
  apiClientBridge,
  $q,
  $window,
  promisify,
  reportError
) {
  var fetchedUser = null;
  var socket = null;
  // For consistency with other promise fetchers
  return function () {
    if (!fetchedUser) {
      fetchedUser = promisify(apiClientBridge, 'fetchUser')('me')
      .then(function (_user) {
        socket = _user.createSocket();
        reportError.setUser(_user);
        return _user;
      })
      .catch(function (err) {
        // Catch an unauth'd request and send 'em back
        if (keypather.get(err, 'data.statusCode') === 401) {
          $window.location = '/';
        }
        // Allow other .catch blocks to grab it
        return $q.reject(err);
      });
    }
    return fetchedUser;
  };
}

function fetchOrgs (
  fetchUser,
  promisify
) {
  var fetchedOrgs;
  return function () {
    if (!fetchedOrgs) {
      fetchedOrgs = fetchUser()
      .then(function (user) {
        return promisify(user, 'fetchGithubOrgs')();
      });
    }
    return fetchedOrgs;
  };
}


var fetchCache = {};

function fetchInstances(
  fetchUser,
  promisify,
  keypather,
  $state,
  exists
) {
  return function (opts, resetCache) {
    if (!opts) {
      opts = {};
    }
    if (!exists(resetCache)) {
      resetCache = false;
    }
    opts.githubUsername = opts.githubUsername || $state.params.userName;

    var fetchKey = jsonHash.digest(opts);
    if (resetCache || !fetchCache[fetchKey]) {
      fetchCache[fetchKey] = fetchUser()
        .then(function (user) {
          var pFetch = promisify(user, 'fetchInstances');
          return pFetch(opts);
        })
        .then(function (results) {
          var instance = results;
          if (opts.name) {
            instance = keypather.get(results, 'models[0]');
          }

          if (!instance) {
            throw new Error('Container not found');
          }
          instance.githubUsername = opts.githubUsername;
          return instance;
        });
    }
    return fetchCache[fetchKey];
  };
}

var fetchByPodCache = {};

function fetchInstancesByPod(
  fetchInstances,
  $state,
  fetchUser
) {
  return function (username) {
    username = username || $state.params.userName;
    if (!fetchByPodCache[username]) {
      var userPromise = fetchUser();
      fetchByPodCache[username] = fetchInstances({
        githubUsername: username
      })
        .then(function (allInstances) {
          var instanceMapping = {};
          allInstances.forEach(function (instance) {
            var ctxVersion = instance.attrs.contextVersion.context;
            instanceMapping[ctxVersion] = instanceMapping[ctxVersion] || {};
            if (instance.attrs.masterPod) {
              instanceMapping[ctxVersion].master = instance;
            } else {
              instanceMapping[ctxVersion].children = instanceMapping[ctxVersion].children || [];
              instanceMapping[ctxVersion].children.push(instance);
            }
          });

          var masterInstances = [];
          Object.keys(instanceMapping).forEach(function (ctxVersion) {
            var master = instanceMapping[ctxVersion].master;

            // Handle the case where we have an extra instance that has no parents.
            if (!master || !master.children) { return; }

            var children = instanceMapping[ctxVersion].children || [];
            masterInstances.push(master);
            master.children.add(children);
          });

          return userPromise.then(function (user) {
            var instances = user.newInstances([], {
              qs: {
                masterPod: true,
                githubUsername: username
              }
            });
            instances.githubUsername = username;
            instances.add(masterInstances);
            return instances;
          });
        });
    }

    return fetchByPodCache[username];
  };
}

function fetchBuild(
  fetchUser,
  promisify
) {
  // No caching here, as there aren't any times we're fetching a build
  //    multiple times that isn't covered by inflight
  return function (buildId) {
    if (!buildId) {
      throw new Error('BuildId is required');
    }

    return fetchUser().then(function (user) {
      var pFetch = promisify(user, 'fetchBuild');
      return pFetch(buildId);
    });
  };
}

function fetchOwnerRepos(fetchUser, promisify) {
  return function (userName) {
    var user;
    var repoType;
    return fetchUser().then(function (_user) {
      if (userName === _user.oauthName()) {
        user = _user;
        repoType = 'GithubRepos';
      } else {
        user = _user.newGithubOrg(userName);
        repoType = 'Repos';
      }
      var allRepos = [];

      function fetchPage(page) {
        return promisify(user, 'fetch' + repoType)({
          page: page,
          sort: 'update'
        }).then(function (githubRepos) {
          allRepos = allRepos.concat(githubRepos.models);
          // recursive until result set returns fewer than
          // 100 repos, indicating last paginated result
          if (githubRepos.models.length < 100) {
            return allRepos;
          }
          return fetchPage(page + 1);
        });
      }
      return fetchPage(1);
    }).then(function (reposArr) {
      var repos = user['new' + repoType](reposArr, {
        noStore: true
      });
      repos.ownerUsername = userName;
      return repos;
    });
  };
}


function fetchRepoBranches(fetchUser, promisify) {
  return function (repo) {
    var user;
    var repoType;
    var allBranches = [];

    function fetchPage(page) {
      return promisify(repo, 'fetchBranches')({
        page: page,
      }).then(function (branches) {
        allBranches = allBranches.concat(branches.models);
        // recursive until result set returns fewer than
        // 100 repos, indicating last paginated result
        if (branches.models.length < 100) {
          return allBranches;
        }
        return fetchPage(page + 1);
      });
    }
    return fetchPage(1)
      .then(function (branchArray) {
        var branches = repo.newBranches(branchArray, {
          noStore: true
        });
        repo.branches = branches;
        return branches;
      });
  };
}

function fetchContexts(fetchUser, promisify) {
  return function (opts) {
    return fetchUser().then(function (user) {
      var contextFetch = promisify(user, 'fetchContexts');
      return contextFetch(opts);
    });
  };
}

function fetchSettings(
  $state,
  $q,
  fetchUser,
  promisify,
  integrationsCache
) {

  return function () {
    var username = $state.params.userName;

    if (integrationsCache[username]) {
      return $q.when(integrationsCache[username].settings);
    }

    return fetchUser().then(function(user) {
      return promisify(user, 'fetchSettings')({
        githubUsername: $state.params.userName
      });
    })
    .then(function (settings) {
      var userSettings = settings.models[0];
      if (userSettings) {
        integrationsCache[$state.params.userName] = {
          settings: userSettings
        };
      }
      return userSettings;
    });
  };
}

function integrationsCache () {
  return {};
}

function fetchSlackMembers (
  $http
) {
  return function (token) {
    return $http({
      method: 'get',
      url: 'https://slack.com/api/users.list?token=' + token,
      'withCredentials': false
    })
    .then(function(data) {
      if (data.data.error) {
        throw new Error(data.data.error);
      }
      return data.data.members.filter(function(member) {
        return !member.is_bot;
      });
    });
  };
}

function fetchGitHubMembers (
  $http,
  configAPIHost
) {
  return function (teamName) {
    return $http({
      method: 'get',
      url: configAPIHost + '/github/orgs/' + teamName + '/members'
    }).then(function (team) {
      return team.data;
    });
  };
}

function fetchGitHubUser (
  $http,
  configAPIHost
) {
  return function (memberName) {
    return $http({
      method: 'get',
      url: configAPIHost + '/github/users/' + memberName
    }).then(function (user) {
      return user.data;
    });
  };
}

function fetchPullRequest (
  $http,
  configAPIHost,
  keypather,
  $q
) {
  return function (instance) {
    var branch = instance.getBranchName();
    if (!branch) {
      return $q.when(null);
    }
    var repo = instance.contextVersion.getMainAppCodeVersion().attrs.repo;
    return $http({
      method: 'get',
      url: configAPIHost + '/github/repos/' + repo + '/pulls?head=' + repo.split('/')[0] + ':' + branch
    }).then(function (pullRequests) {
      return keypather.get(pullRequests, 'data[0]');
    });
  };
}