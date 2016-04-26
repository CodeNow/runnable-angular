'use strict';

require('app')
  .factory('fetchRepoDockerfiles', fetchRepoDockerfiles)
  .factory('fetchDockerfileForContextVersion', fetchDockerfileForContextVersion);

function fetchRepoDockerfiles(
  $q,
  $http,
  configAPIHost,
  keypather
) {
  return function (repoFullName, branchName) {
    branchName = (branchName) ? branchName : 'master';
    return $http({
      method: 'get',
      url: configAPIHost + '/github/repos/' + repoFullName + '/contents/Dockerfile?ref=' + branchName
    })
      .then(function (res) {
        var file = res.data;
        if (file.message && file.message.match(/not.found/i)) {
          return [];
        }
        // GH doesnt return the '/' when returning a path
        file.path = '/' + file.path;
        return [file];
      });
  };
}

function fetchDockerfileForContextVersion (
  base64,
  fetchRepoDockerfiles,
  keypather,
  promisify
) {
  return function (contextVersion) {
    var buildDockerfilePath = keypather.get(contextVersion, 'attrs.buildDockerfilePath');
    var acv = contextVersion.getMainAppCodeVersion();
    var repoFullName = keypather.get(acv, 'attrs.repo');
    if (buildDockerfilePath && repoFullName) {
      var branchName = keypather.get(acv, 'attrs.branch');
      // Get everything before the last '/' and add a '/' at the end
      var result = /^([^\/]*)\/([^\/]*)$/.exec(buildDockerfilePath);
      if (result.length < 3) {
        throw new Error('BuilddockerfilePath is invalid');
      }
      var path = result && result[1] || '';
      // Get everything after the last '/'
      var name = result && result[2] || '';
      return fetchRepoDockerfiles(repoFullName, branchName)
        .then(function (dockerfiles) {
          var dockerfile = dockerfiles[0];
          return contextVersion.newFile({
            _id: dockerfile.sha,
            id: dockerfile.sha,
            body: base64.decode(dockerfile.content),
            isRemoteCopy: true,
            name: name,
            path: path + '/'
          });
        });
    }
    return promisify(contextVersion, 'fetchFile')('/Dockerfile');
  };
}
