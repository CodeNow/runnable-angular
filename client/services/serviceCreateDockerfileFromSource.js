'use strict';

require('app')
  .factory('createDockerfileFromSource', createDockerfileFromSource);

function createDockerfileFromSource(
  async,
  errs,
  fetchUser,
  hasKeypaths,
  QueryAssist
) {
  return function (contextVersion, stackName, cb) {
    function fetchSeedContexts(user, cb) {
      new QueryAssist(user, cb)
        .wrapFunc('fetchContexts')
        .query({
          isSource: true
        })
        .cacheFetch(function (contexts, cached, cb) {
          if (contexts) {
            var source = contexts.models.find(hasKeypaths({
              'attrs.name.toLowerCase()': stackName.toLowerCase()
            }));
            if (!source) {
              return cb(new Error('Cannot find matching Source Dockerfile'));
            } else {
              cb(null, source);
            }
          } else {
            cb(new Error('Cannot find matching Source Dockerfile'));
          }
        })
        .resolve(function (err) {
          errs.handler(err);
        })
        .go();
    }
    function fetchContextVersion(context, cb) {
      var queryLatestVersion = { sort: '-created', limit: 1 };
      var versions = context.fetchVersions(queryLatestVersion, function (err) {
        cb(err, versions);
      });
    }
    function copyFilesFromSource(versions, cb) {
      var sourceInfraCodeVersion = versions.models[0].attrs.infraCodeVersion;
      var sourceContextVersion = versions.models[0];
      contextVersion.copyFilesFromSource(sourceInfraCodeVersion, function (err) {
        contextVersion.source = sourceContextVersion.id();
        cb(err, contextVersion);
      });
    }
    function fetchDockerfile(contextVersion, cb) {
      var file = contextVersion.fetchFile('/Dockerfile', function(err) {
        cb(err, file);
      });
    }

    async.waterfall([
      fetchUser,
      fetchSeedContexts,
      fetchContextVersion,
      copyFilesFromSource,
      fetchDockerfile
    ], cb);
  };
}
