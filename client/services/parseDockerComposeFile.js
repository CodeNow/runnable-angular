'use strict';

require('app')
  .factory('parseDockerComposeFile', parseDockerComposeFile);

function parseDockerComposeFile(
  base64,
  jsYaml
) {
  return function (dockerfileContent) {
    var dockerfileYAML = base64.decode(dockerfileContent);
    return jsYaml.safeLoad(dockerfileYAML);
  };
}
