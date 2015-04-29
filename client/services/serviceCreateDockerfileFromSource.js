'use strict';

require('app')
  .factory('createDockerfileFromSource', createDockerfileFromSource);

require('app')
  .factory('fetchDockerfileFromSource', fetchDockerfileFromSource);

function createDockerfileFromSource(
  fetchContexts,
  hasKeypaths,
  promisify
) {
  return function (contextVersion, stackName, sourceContexts) {
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
    if (sourceContexts !== null) {
      return findAndCreateFromSource(sourceContexts);
    } else {
      return fetchContexts({
        isSource: true
      }).then(findAndCreateFromSource);
    }
  };
}

function fetchDockerfileFromSource(
  fetchContexts,
  hasKeypaths,
  promisify
) {
  return function (stackName, sourceContexts) {
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

          var fetchDockerfile = promisify(sourceContextVersion, 'fetchFile');
          return fetchDockerfile('/Dockerfile');
        });
    }
    return findAndCreateFromSource(sourceContexts);
  };
}
