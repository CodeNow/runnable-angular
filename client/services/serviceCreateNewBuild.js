'use strict';

require('app')
  .factory('createNewBuild', createNewBuild)
  .factory('createNewBuildAndFetchBranch', createNewBuildAndFetchBranch);

function createNewBuild(
  fetchUser,
  promisify,
  $q,
  uuid
) {
  return function (activeAccount, opts) {
    opts = opts || {};
    var dockerfilePath = opts.dockerfilePath;
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
              buildDockerfilePath: dockerfilePath
            });
          }
          return version;
        });
    }

    function createBuild(version) {
      return promisify(thisUser, 'createBuild')({
        contextVersions: [version.id()],
        owner: {
          github: activeAccount.oauthId()
        }
      })
        .then(function (build) {
          // This is needed for part of GS
          build.contextVersion = version;
          return build;
        });
    }

    return fetchUser()
      .then(function (user) {
        thisUser = user;
        return createContext(user);
      })
      .then(createVersion)
      .then(createBuild);

  };
}

function createNewBuildAndFetchBranch(
  createDockerfileFromSource,
  createNewBuild,
  errs,
  fetchStackData,
  promisify
)  {
  return function (activeAccount, repo, dockerfilePath) {
    var inputs = {
      repo: repo,
      masterBranch: null,
      build: null
    };
    return fetchStackData(repo)
      .then(function () {
        return createNewBuild(activeAccount, { dockerfilePath: dockerfilePath });
      })
      .then(function (buildWithVersion) {
        inputs.build = buildWithVersion;
        if (!inputs.build.contextVersion.source) {
          return createDockerfileFromSource(inputs.build.contextVersion, 'blank');
        }
        return buildWithVersion.contextVersion;
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
          var message = 'Failed to add Webhooks. Please invite a member of this repository\'s owners team to add it to Runnable for the first time';
          errs.handler(new Error(message));
        } else {
          errs.handler(err);
        }
      });
  };
}
