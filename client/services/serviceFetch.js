'use strict';

require('app')
  .factory('pFetchUser', pFetchUser)
  .factory('fetchInstances', fetchInstances)
  .factory('fetchBuild', fetchBuild)
  .factory('fetchOwnerRepos', fetchOwnerRepos)
  .factory('fetchContexts', fetchContexts)
  .factory('fetchSlackMembers', fetchSlackMembers);

function pFetchUser(user, $q) {
  // Promise version of serviceFetchUser
  // http://stackoverflow.com/a/22655010/1216976
  var d = $q.defer();
  user.fetchUser('me', function (err) {
    if (err) {
      return d.reject(err);
    }
    return d.resolve(user);
  });

  // For consistency with other promise fetchers
  return function () {
    return d.promise;
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
  var userStream;

  $rootScope.$watch('dataApp.data.activeAccount.oauthId()', function(id) {
    if (!id) { return; }
    currentInstanceList = null;
    userStream = primus.createUserStream(id);
    userStream.on('reconnect', function () {
      $log.warn('RECONNECTING INSTANCE ROOM');
    });
    userStream.on('offline', function () {
      $log.warn('OFFLINE INSTANCE ROOM');
    });
    userStream.on('end', function () {
      $log.warn('INSTANCE ROOM DIED!!!!');
    });
    userStream.on('reconnected', function (opts) {
      $log.warn('INSTANCE Reconnected!!!! Took ' + opts.duration + 'ms');
    });
    userStream.on('reconnect timeout', function (err) {
      $log.warn('!!!!INSTANCE reconnect timeout!!!! ' + err.message);
    });
    userStream.on('reconnect failed', function (err) {
      $log.warn('INSTANCE reconnect failed!!!! WE ARE BONED!!!! ' + err.message);
    });

    userStream.on('data', function (data) {
      if (data.event !== 'ROOM_MESSAGE') {
        return;
      }
      if (configEnvironment !== 'production') {
        $log.log('Socket:', data);
      }
      if (keypather.get(data, 'data.data.owner.github') !== id) {
        return;
      }
      if (!currentInstanceList) {
        $log.warn('WHY ARE THE INSTANCES GONE??????????');
        return;
      }
      if (!keypather.get(data, 'data.data.name')) { return; }

      var cachedInstance;
      function findInstance(instance) {
        return instance.attrs.shortHash === data.data.data.shortHash;
      }
      // Possible events:
      // start, stop, restart, update, redeploy, deploy, delete, patch, post
      // container_inspect, container_inspect_err
      switch (data.data.action) {
      case 'deploy':
      case 'start':
      case 'stop':
      case 'restart':
      case 'update':
      case 'redeploy':
      case 'patch':
      case 'container_inspect': // Instance died independently
        cachedInstance = currentInstanceList.find(findInstance);
        if (cachedInstance) {
          cachedInstance.parse(data.data.data);
        } else {
          // We're getting data about an instance we haven't seen yet.
          // i.e. we got the `deploy` event before `post`
          currentInstanceList.add(data.data.data);
        }
        break;
      case 'post':
        cachedInstance = currentInstanceList.find(findInstance);
        if (!cachedInstance) {
          currentInstanceList.add(data.data.data);
        }
        break;
      case 'delete':
        cachedInstance = currentInstanceList.find(findInstance);
        if (cachedInstance) {
          currentInstanceList.remove(cachedInstance);
          if ($stateParams.instanceName === cachedInstance.attrs.name) {
            // the current instance just got deleted
            keypather.set(
              $localStorage,
              'lastInstancePerUser.' + $stateParams.userName,
              null
            );
            errs.handler(new Error('The instance you were looking at has been deleted.'));
            $state.go('instance.home', {
              userName: $stateParams.userName
            });
          }
        }
        break;
      case 'container_inspect_err':
        errs.handler(data);
        break;
      default:
        errs.handler('Error: unknown event encountered');
        break;
      }
      $timeout(angular.noop);
    });
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

function fetchBuild(
  errs,
  pFetchUser,
  promisify,
  $q
) {
  // No caching here, as there aren't any times we're fetching a build
  //    multiple times that isn't covered by inflight
  return function (buildId) {
    if (!buildId) {
      throw new Error('BuildId is required');
    }

    return pFetchUser().then(function(user) {
      var pFetch = promisify(user, 'fetchBuild');
      return pFetch(buildId);
    }).then(function(build) {
      return build;
    });
  };
}

function fetchOwnerRepos (
  $rootScope,
  pFetchUser,
  errs,
  promisify
) {
  return function (userName) {
    var user;
    var repoType;
    return pFetchUser().then(function(_user) {
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
        }).then(function(githubRepos) {
          allRepos = allRepos.concat(githubRepos.models);
          // recursive until result set returns fewer than
          // 100 repos, indicating last paginated result
          if (githubRepos.models.length < 100) {
            return allRepos;
          } else {
            return fetchPage(page + 1);
          }
        });
      }
      return fetchPage(1);
    }).then(function(reposArr) {
      var repos = user['new' + repoType](reposArr, {
        noStore: true
      });
      repos.ownerUsername = userName;
      return repos;
    });
  };
}

function fetchContexts (
  pFetchUser,
  promisify
) {
  return function (opts) {
    return pFetchUser().then(function(user) {
      var contextFetch = promisify(user, 'fetchContexts');
      return contextFetch(opts);
    });
  };
}

// Using $http here because this isn't in API client
function fetchSlackMembers (
  $http,
  configAPIHost
) {
  return function () {
    var org = 'Runnable';
    return $http({
      method: 'get',
      url: 'https://slack.com/api/users.list?token=xoxp-2319488034-2915508610-3982407583-3fade0&pretty=1',
      'withCredentials': false
    })
    .then(function(data) {
      return data.data.members.filter(function(member) {
        return !member.is_bot;
      });
    });
  };
}