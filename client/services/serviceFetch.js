'use strict';

require('app')
  .factory('pFetchUser', pFetchUser)
  .factory('fetchInstances', fetchInstances)
  .factory('fetchBuild', fetchBuild)
  .factory('fetchOwnerRepos', fetchOwnerRepos)
  .factory('fetchContexts', fetchContexts);

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
  pFetchUser,
  promisify,
  keypather,
  hasKeypaths,
  errs,
  $stateParams,
  $q,
  primus
) {
  var currentInstanceList;
  var userStream;

  pFetchUser().then(function(user) {
    userStream = primus.createUserStream(user.oauthId());

    userStream.on('data', function (data) {
      if (data.event !== 'ROOM_MESSAGE') {
        return;
      }
      if (!currentInstanceList) { return; }
      if (!keypather.get(data, 'data.data.name')) { return; }
      var cachedInstance = currentInstanceList.find(hasKeypaths({
        'attrs.name': data.data.data.name
      }));
      if (cachedInstance) {
        cachedInstance.parse(data.data.data);
      }
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
    return pFetchUser().then(function(user) {
      var pFetch = promisify(user, 'fetchInstances');
      return pFetch(opts);
    }).then(function(results) {
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
    }).catch(errs.handler);
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
    }).catch(errs.handler);
  };
}

function fetchOwnerRepos (
  pFetchUser,
  errs,
  promisify
) {
  var user;
  return function (userName) {
    return pFetchUser().then(function(_user) {
      user = _user;
      var repoFetch;
      if (userName === user.oauthName()) {
        repoFetch = promisify(user, 'fetchGithubRepos');
      } else {
        repoFetch = promisify(user.newGithubOrg(userName), 'fetchRepos');
      }

      var allRepos = [];

      function fetchPage(page) {
        return repoFetch({
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
      return user.newGithubRepos(reposArr, {
        noStore: true
      });
    }).catch(errs.handler);
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