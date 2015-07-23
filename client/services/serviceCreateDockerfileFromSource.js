'use strict';

require('app')
  .factory('createDockerfileFromSource', createDockerfileFromSource);

require('app')
  .factory('fetchDockerfileFromSource', fetchDockerfileFromSource);

function createDockerfileFromSource(
  fetchSourceContexts,
  hasKeypaths,
  promisify
) {
  return function (contextVersion, stackName) {
    var sourceContextVersion;

    function findAndCreateFromSource(sourceContexts) {
      if (!sourceContexts) {
        throw new Error('Cannot find matching Source Dockerfile');
      }
      var source = sourceContexts.models.find(hasKeypaths({
        'attrs.name.toLowerCase()': stackName.toLowerCase()
      }));
      if (!source) {
        throw new Error('Cannot find matching Source Dockerfile');
      }

      var fetchContextVersion = promisify(source, 'fetchVersions');
      return fetchContextVersion({ qs: { sort: '-created' }})
        .then(function (versions) {
          var sourceInfraCodeVersion = versions.models[0].attrs.infraCodeVersion;
          sourceContextVersion = versions.models[0];

          var copyFilesFromSource = promisify(contextVersion, 'copyFilesFromSource');

          return copyFilesFromSource(sourceInfraCodeVersion);
        })
        .then(function () {
          contextVersion.source = sourceContextVersion.id();

          var fetchDockerfile = promisify(contextVersion, 'fetchFile');
          return fetchDockerfile('/Dockerfile');
        });
      }
    return fetchSourceContexts()
      .then(findAndCreateFromSource);
  };
}

function fetchDockerfileFromSource(
  fetchSourceContexts,
  hasKeypaths,
  promisify
) {
  return function (stackName) {
    var sourceContextVersion;

    function findFromSource(sourceContexts) {
      if (!sourceContexts) {
        throw new Error('Cannot find matching Source Dockerfile');
      }
      var source = sourceContexts.models.find(hasKeypaths({
        'attrs.name.toLowerCase()': stackName.toLowerCase()
      }));
      if (!source) {
        throw new Error('Cannot find matching Source Dockerfile');
      }

      var fetchContextVersion = promisify(source, 'fetchVersions');
      return fetchContextVersion({ qs: { sort: '-created' }})
        .then(function (versions) {
          sourceContextVersion = versions.models[0];

          var fetchDockerfile = promisify(sourceContextVersion, 'fetchFile');
          return fetchDockerfile('/Dockerfile');
        });
    }

    return fetchSourceContexts()
      .then(findFromSource);
  };
}
