'use strict';
var jsonHash = require('json-hash');

require('app')
  .factory('pFetchUser', pFetchUser)
  .factory('fetchInstances', fetchInstances)
  .factory('fetchBuild', fetchBuild)
  .factory('fetchOwnerRepos', fetchOwnerRepos)
  .factory('fetchContexts', fetchContexts)
  .factory('fetchSettings', fetchSettings)
  .factory('fetchSlackMembers', fetchSlackMembers)
  .factory('fetchGitHubMembers', fetchGitHubMembers)
  .factory('fetchGitHubUser', fetchGitHubUser)
  .factory('integrationsCache', integrationsCache)
  .factory('fetchInstancesByPod', fetchInstancesByPod);

function pFetchUser(keypather, user, $q, $state) {
  var fetchedUser = null;
  var socket = null;
  // For consistency with other promise fetchers
  return function () {
    if (!fetchedUser) {
      // Promise version of serviceFetchUser
      // http://stackoverflow.com/a/22655010/1216976
      var deferred = $q.defer();
      fetchedUser = deferred.promise;
      user.fetchUser('me', function (err) {
        if (err) {
          if (keypather.get(err, 'data.statusCode') === 401 &&
              !keypather.get($state, 'current.data.anon')) {
            $state.go('home');
          }
          deferred.reject(err);
        } else {
          if (!socket) {
            socket = user.createSocket();
          }
          deferred.resolve(user);
        }
      });
    }
    return fetchedUser;
  };
}

var fetchCache = {};

function fetchInstances(
  pFetchUser,
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
      fetchCache[fetchKey] = pFetchUser()
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
            throw new Error('Instance not found');
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
  $q,
  promisify,
  $state
) {
  return function (username) {
    username = username || $state.params.userName;
    if (!fetchByPodCache[username]) {
      fetchByPodCache[username] = fetchInstances({
        masterPod: true,
        githubUsername: username
      })
        .then(function (masterPods) {
          var podFetch = [];
          masterPods.forEach(function (masterInstance) {
            podFetch.push(promisify(masterInstance.children, 'fetch')());
          });
          return $q.all(podFetch).then(function () {
            return masterPods;
          });
        });
    }

    return fetchByPodCache[username];

  };
}

function fetchBuild(
  pFetchUser,
  promisify
) {
  // No caching here, as there aren't any times we're fetching a build
  //    multiple times that isn't covered by inflight
  return function (buildId) {
    if (!buildId) {
      throw new Error('BuildId is required');
    }

    return pFetchUser().then(function (user) {
      var pFetch = promisify(user, 'fetchBuild');
      return pFetch(buildId);
    });
  };
}

function fetchOwnerRepos(pFetchUser, promisify) {
  return function (userName) {
    var user;
    var repoType;
    return pFetchUser().then(function (_user) {
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

function fetchContexts(pFetchUser, promisify) {
  return function (opts) {
    return pFetchUser().then(function (user) {
      var contextFetch = promisify(user, 'fetchContexts');
      return contextFetch(opts);
    });
  };
}

function fetchSettings(
  $state,
  $q,
  pFetchUser,
  promisify,
  integrationsCache
) {

  return function () {
    var username = $state.params.userName;

    if (integrationsCache[username]) {
      return $q.when(integrationsCache[username].settings);
    }

    return pFetchUser().then(function(user) {
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