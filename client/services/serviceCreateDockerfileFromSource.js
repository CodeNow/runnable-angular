'use strict';

require('app')
  .factory('createDockerfileFromSource', createDockerfileFromSource);

function createDockerfileFromSource(
  fetchContexts,
  hasKeypaths,
  promisify
) {
  return function (contextVersion, stackName) {
    var sourceContextVersion;
    return fetchContexts({
      isSource: true
    }).then(function (contexts) {
      if (!contexts) {
        throw new Error('Cannot find matching Source Dockerfile');
      }
      var source = contexts.models.find(hasKeypaths({
        'attrs.name.toLowerCase()': stackName.toLowerCase()
      }));
      if (!source) {
        throw new Error('Cannot find matching Source Dockerfile');
      }

      var fetchContextVersion = promisify(source, 'fetchVersions');
      return fetchContextVersion({ qs: { sort: '-created' }});
    }).then(function (versions) {
      var sourceInfraCodeVersion = versions.models[0].attrs.infraCodeVersion;
      sourceContextVersion = versions.models[0];

      var copyFilesFromSource = promisify(contextVersion, 'copyFilesFromSource');

      return copyFilesFromSource(sourceInfraCodeVersion);
    }).then(function () {
      contextVersion.source = sourceContextVersion.id();

      var fetchDockerfile = promisify(contextVersion, 'fetchFile');
      return fetchDockerfile('/Dockerfile');
    });
  };
}
