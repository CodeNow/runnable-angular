'use strict';

require('app')
  .factory('pFetchInstances', fetchInstances);

function fetchInstances(
  pFetchUser,
  promisify,
  QueryAssist,
  keypather,
  hasKeypaths,
  errs,
  $stateParams,
  $q
) {
  var currentAccountName = $stateParams.userName;
  var currentInstanceList;
  return function (opts) {
    if (!opts) {
      opts = {};
    }

    if (!opts.githubUsername && currentInstanceList) {
      var cachedInstance = currentInstanceList.find(hasKeypaths({
        'attrs.name': opts.name
      }));
      if (cachedInstance) {
        console.log('cache hit', cachedInstance);
        return $q.when(cachedInstance);
      }
    }

    return pFetchUser.then(function(user) {
      console.log('pFetchUser');
      var pFetch = promisify(user, 'fetchInstances');
      opts.githubUsername = opts.githubUsername || currentAccountName;
      return pFetch(opts);
    }).then(function(results) {
      console.log('results', results);
      var instance;
      if (opts.name) {
        instance = keypather.get(results, 'models[0]');
      } else {
        currentInstanceList = results;
        instance = results;
      }
      return instance;
    }).catch(errs.handler);
  };
}
