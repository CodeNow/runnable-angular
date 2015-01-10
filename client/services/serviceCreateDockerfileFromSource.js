require('app')
  .factory('createDockerfileFromSource', createDockerfileFromSource);

function createDockerfileFromSource(
  async,
  fetchUser,
  QueryAssist
) {
  return function (build, stackName, cb) {
    function fetchSeedContexts(user, cb) {
      new QueryAssist(user, cb)
        .wrapFunc('fetchContexts')
        .query({
          isSource: true,
          name: stackName
        })
        .cacheFetch(function (contexts, cached, cb) {
          cb(null, contexts);
        })
        .resolve(cb)
        .go();
    }
    function fetchContextVersion(context, cb) {
      var versions = context.fetchVersions(function (err) {
        cb(err, versions);
      });
    }
    function copyFilesFromSource(versions, cb) {
      var sourceInfraCodeVersion = versions.models[0].attrs.infraCodeVersion;
      var contextVersion = build.contextVersions.models[0];
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
