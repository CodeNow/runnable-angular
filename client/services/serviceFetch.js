'use strict';

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
  .factory('integrationsCache', integrationsCache);

// We need to put this somewhere
// modelStore.on('socket-updated', function () {
//   $timeout(angular.noop);
// });

function pFetchUser(keypather, user, $q, $state, modelStore) {
  var fetchedUser = null;
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
          deferred.resolve(user);
        }
      });
    }
    return fetchedUser;
  };
}

function fetchInstances(
  configEnvironment,
  pFetchUser,
  promisify,
  keypather,
  hasKeypaths,
  errs,
  $stateParams,
  $state,
  $localStorage,
  $q,
  primus,
  $rootScope,
  $timeout,
  $log
) {
  var currentInstanceList;

  $rootScope.$watch('dataApp.data.activeAccount.oauthId()', function (id) {
    if (!id) { return; }
    var socket = pFetchUser.socket;
    socket.joinRoom(id, angular.noop);
    socket.on('reconnect', function () {
      $log.warn('RECONNECTING INSTANCE ROOM');
    });
    socket.on('offline', function () {
      $log.warn('OFFLINE INSTANCE ROOM');
    });
    socket.on('end', function () {
      $log.warn('INSTANCE ROOM DIED!!!!');
    });
    socket.on('reconnected', function (opts) {
      $log.warn('INSTANCE Reconnected!!!! Took ' + opts.duration + 'ms');
    });
    socket.on('reconnect timeout', function (err) {
      $log.warn('!!!!INSTANCE reconnect timeout!!!! ' + err.message);
    });
    socket.on('reconnect failed', function (err) {
      $log.warn('INSTANCE reconnect failed!!!! WE ARE BONED!!!! ' + err.message);
    });
    socket.on('open', function (opts) {
      $log.warn('INSTANCE ROOM RECONNECTED!!!, SUCCESS!!!!!!');
    });
    if (configEnvironment !== 'production') {
      socket.on('data', function (data) {
        if (data.event !== 'ROOM_MESSAGE') {
          return;
        }
        $log.log('Socket:', data);
      });
    }
  });
  return function (opts) {
    if (!opts) {
      opts = {};
    }

    // Check how cache works with HelloRunnable
    // Consider querying against ModelStore

    if (!opts.githubUsername && currentInstanceList && opts.name) {
      var cachedInstance = currentInstanceList.find(hasKeypaths({
        'attrs.name': opts.name
      }));
      if (cachedInstance) {
        return $q.when(cachedInstance);
      }
    }

    opts.githubUsername = opts.githubUsername || $stateParams.userName;
    return pFetchUser().then(function (user) {
      var pFetch = promisify(user, 'fetchInstances');
      return pFetch(opts);
    }).then(function (results) {
      var instance;
      if (opts.name) {
        instance = keypather.get(results, 'models[0]');
      } else {
        if (opts.githubUsername === $stateParams.userName) {
          currentInstanceList = results;
        }
        instance = results;
      }

      if (!instance) {
        throw new Error('Instance not found');
      }
      instance.githubUsername = opts.githubUsername;

      return instance;
    });
  };
}
require('app')
  .factory('fetchInstancesByPod', fetchInstancesByPod);
function fetchInstancesByPod(
  fetchInstances,
  $q,
  $filter
) {
  return function () {
    // Fetch all master pods
    var instances = {};
    instances.masters = fetchInstances({
      masterPod: true
    });
    instances.forks = fetchInstances({
      masterPod: false
    });

    return $q.all([instances.masters, instances.forks])
    .then(function (deps) {
      var instanceMapping = {};

      var instanceList = [];
      deps[0].forEach(function (instance) {
        var instanceItem = {
          master: instance,
          children: []
        };
        instanceList.push(instanceItem);
        instanceMapping[instance.attrs.contextVersion.context] = instanceItem;
      });

      deps[1].forEach(function (instance) {
        var mapping = instanceMapping[instance.attrs.contextVersion.context];
        if (mapping) {
          mapping.children.push(instance);
        } else {
          console.log('Orphaned Instance!', instance);
          instanceList.push({
            master: instance,
            children: []
          });
        }
      });


      instanceList = $filter('orderBy')(instanceList, 'master.attrs.name');
      instanceList.forEach(function (instance) {
        instance.children = $filter('orderBy')(instance.children, 'attrs.name');
      });

      return instanceList;
    });
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

    var settings;
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