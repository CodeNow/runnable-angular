'use strict';

require('app')
  .factory('createNewBuild', createNewBuild)
  .factory('createNewBuildByContextVersion', createNewBuildByContextVersion)
  .factory('createNewBuildAndFetchBranch', createNewBuildAndFetchBranch);

function createNewBuildByContextVersion(
  fetchUser,
  promisify
) {
  return function (activeAccount, version) {
    return fetchUser()
      .then(function (user) {
        return promisify(user, 'createBuild')({
          contextVersion: version.id(),
          owner: {
            github: activeAccount.oauthId()
          }
        });
      })
      .then(function (build) {
        // This is needed for part of GS
        build.contextVersion = version;
        return build;
      });
  };
}

function createNewBuild(
  createNewBuildByContextVersion,
  fetchUser,
  promisify,
  $q,
  uuid
) {
  return function (activeAccount, opts) {
    opts = opts || {};
    var dockerfilePath = opts.dockerfilePath;
    var configurationMethod = opts.configurationMethod;
    var thisUser, version;
    function createContext(user) {
      return promisify(user, 'createContext')({
        name: uuid.v4(),
        owner: {
          github: activeAccount.oauthId()
        }
      });
    }

    function createVersion(context) {
      return promisify(context, 'createVersion')()
        .then(function (version) {
          if (dockerfilePath) {
            return promisify(version, 'update')({
              advanced: true,
              buildDockerfilePath: dockerfilePath
            });
          }
          if (configurationMethod === 'blankDockerfile') {
            return promisify(version, 'update')({
              advanced: true,
            });
          }
          return version;
        });
    }

        return fetchUser()
      .then(function (user) {
        thisUser = user;
        return createContext(user);
      })
      .then(createVersion)
      .then(function (version) {
        return createNewBuildByContextVersion(activeAccount, version);
      });
  };
}

function createNewBuildAndFetchBranch(
  $q,
  createDockerfileFromSource,
  createNewBuild,
  fetchStackData,
  promisify
)  {
  return function (activeAccount, repo, dockerfilePath, configurationMethod) {
    var inputs = {
      repo: repo,
      masterBranch: null,
      build: null
    };
    return fetchStackData(repo)
      .then(function () {
        return createNewBuild(activeAccount, {
          configurationMethod: configurationMethod,
          dockerfilePath: dockerfilePath
        });
      })
      .then(function (buildWithVersion) {
        inputs.build = buildWithVersion;
        if (!inputs.build.contextVersion.source) {
          return createDockerfileFromSource(inputs.build.contextVersion, 'blank');
        }
      })
      .then(function () {
        return promisify(repo, 'fetchBranch')(repo.attrs.default_branch);
      })
      .then(function (masterBranch) {
        inputs.masterBranch = masterBranch;
        // Set the repo here so the page change happens after all of these fetches
        return promisify(inputs.build.contextVersion.appCodeVersions, 'create', true)({
          repo: repo.attrs.full_name,
          branch: masterBranch.attrs.name,
          commit: masterBranch.attrs.commit.sha
        });
      })
      .then(function () {
        return inputs;
      })
      .catch(function (err) {
        if (err.message.match(/repo.*not.*found/ig)) {
          var message = 'Failed to add Webhooks. Please invite a member of this repository’s owners team to add it to Runnable for the first time';
          return $q.reject(new Error(message));
        }
        return $q.reject(err);
      });
  };
}
