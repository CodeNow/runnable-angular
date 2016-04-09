'use strict';

require('app')
  .controller('SetupMirrorServerModalController', SetupMirrorServerModalController);

function SetupMirrorServerModalController(
  $scope,
  $controller,
  $q,
  $rootScope,
  createAndBuildNewContainer,
  createBuildFromContextVersionId,
  errs,
  eventTracking,
  fetchUser,
  helpCards,
  keypather,
  loading,
  loadingPromises,
  promisify,
  cardInfoTypes,
  OpenItems,
  close,
  repo,
  build,
  masterBranch
) {
  var SMC = this; // Server Modal Controller (shared with EditServerModalController)
  window.SMC =  SMC;
  SMC.helpCards = helpCards;

  var parentController = $controller('ServerModalController as SMC', { $scope: $scope });
  angular.extend(SMC, {
    'closeWithConfirmation': parentController.closeWithConfirmation.bind(SMC),
    'changeTab': parentController.changeTab.bind(SMC),
    'insertHostName': parentController.insertHostName.bind(SMC),
    'isDirty': parentController.isDirty.bind(SMC),
    'getNumberOfOpenTabs': parentController.getNumberOfOpenTabs.bind(SMC),
    'getUpdatePromise': parentController.getUpdatePromise.bind(SMC),
    'openDockerfile': parentController.openDockerfile.bind(SMC),
    'populateStateFromData': parentController.populateStateFromData.bind(SMC),
    'rebuildAndOrRedeploy': parentController.rebuildAndOrRedeploy.bind(SMC),
    'requiresRebuild': parentController.requiresRebuild.bind(SMC),
    'requiresRedeploy': parentController.requiresRedeploy.bind(SMC),
    'resetStateContextVersion': parentController.resetStateContextVersion.bind(SMC),
    'saveInstanceAndRefreshCards': parentController.saveInstanceAndRefreshCards.bind(SMC),
    'updateInstanceAndReset': parentController.updateInstanceAndReset.bind(SMC),
    'TAB_VISIBILITY': parentController.TAB_VISIBILITY
  });

  var mainRepoContainerFile = new cardInfoTypes.MainRepository();
  // Set initial state
  angular.extend(SMC, {
    name: 'setupServerModal',
    isLoading: $rootScope.isLoading,
    portsSet: false,
    isNewContainer: true,
    openItems: new OpenItems(),
    getDisplayName: function () {
      if (SMC.instance) {
        return SMC.instance.getDisplayName();
      }
      return SMC.state.repo.attrs.name;
    },
    getElasticHostname: function () {
      if (keypather.get(SMC, 'state.repo.attrs')) {
        // NOTE: Is SMC the best way to get the hostname?
        var repo = SMC.state.repo;
        var repoName = repo.attrs.name;
        var repoOwner = repo.attrs.owner.login.toLowerCase();
        var domain = SMC.state.repo.opts.userContentDomain;
        // NOTE: How can I know whether it will be staging or not?
        var hostname = repoName + '-staging-' + repoOwner + '.' + domain;
        return hostname;
      }
      return '';
    },
    state: {
      advanced: false,
      containerFiles: [
        mainRepoContainerFile
      ],
      mainRepoContainerFile: mainRepoContainerFile,
      ports: [],
      packages: new cardInfoTypes.Packages(),
      promises: {},
      opts: {
        masterPod: true,
        name: '',
        env: [],
        ipWhitelist: {
          enabled: false
        }
      },
      whitelist: [
        {address: ['1.1.1.1', '1.1.1.10'], description: ''},
        {address: ['1.1.1.3'], description: 'Test'},
        {address: ['1.1.1.9'], description: 'Runnable'},
        {address: ['1.1.1.4', '1.1.1.5'], description: ''}
      ]
    },
    actions: {
      close: SMC.closeWithConfirmation.bind(SMC, close)
    },
    data: {},
    selectedTab: 'buildfiles'
  });
  loading.reset(SMC.name);
  loadingPromises.clear(SMC.name);
  loading.reset(SMC.name + 'IsBuilding');

  if (!(repo && build && masterBranch)) {
    throw new Error('Repo, build and masterBranch are needed');
  }

  // If a repo is passed into this controller, select that repo
  angular.extend(SMC.state, {
    repo: repo,
    build: build,
    contextVersion: build.contextVersion,
    acv: build.contextVersion.getMainAppCodeVersion(),
    branch: masterBranch,
    repoSelected: true,
    advanced: false
  });
  SMC.state.mainRepoContainerFile.name = repo.attrs.name;
  SMC.state.opts.name = normalizeRepoName(repo);
  SMC.state.promises.contextVersion = $q.when(SMC.state.contextVersion);
  SMC.state.isMirroingDockerfile = true;
  var fullpath = keypather.get(SMC, 'state.build.contextVersion.attrs.buildDockerfilePath');
  // Get everything before the last '/' and add a '/' at the end
  var path = fullpath.replace(/^(.*)\/.*$/, '$1') + '/';
  // Get everything after the last '/'
  var name = fullpath.replace(/^.*\/(.*)$/, '$1');
  fetchUser()
    .then(function (user) {
      // TODO: Match with dockefile path
      SMC.state.dockerfile = SMC.state.contextVersion.newFile({
        _id: repo.dockerfiles[0].sha,
        id: repo.dockerfiles[0].sha,
        body: atob(repo.dockerfiles[0].content),
        name: name,
        path: path
      });
      SMC.openItems.add(SMC.state.dockerfile);
    });

  $scope.$on('resetStateContextVersion', function ($event, contextVersion, showSpinner) {
    $event.stopPropagation();
    if (showSpinner) {
      loading(SMC.name, true);
    }
    SMC.resetStateContextVersion(contextVersion, showSpinner)
      .catch(errs.handler)
      .finally(function () {
        if (showSpinner) {
          loading(SMC.name, false);
        }
      });
  });

  function normalizeRepoName(repo) {
    return repo.attrs.name.replace(/[^a-zA-Z0-9-]/g, '-');
  }

  SMC.showStackSelector = function () {
    return false;
  };

  SMC.rebuild = function (noCache, forceRebuild) {
    loading(SMC.name, true);
    return SMC.rebuildAndOrRedeploy(noCache, forceRebuild)
      .then(function () {
        return SMC.resetStateContextVersion(SMC.instance.contextVersion, true);
      })
      .then(function (contextVersion) {
        return contextVersion;
      })
      .catch(errs.handler)
      .finally(function () {
        loading(SMC.name, false);
      });
  };

  SMC.createServer = function () {
    // Wait until all changes to the context version have been resolved before
    // creating a build with that context version
    return loadingPromises.finished(SMC.name)
     .then(function () {
        if (SMC.state.acv.attrs.branch !== SMC.state.branch.attrs.name) {
          return promisify(SMC.state.acv, 'update')({
            repo: SMC.state.repo.attrs.full_name,
            branch: SMC.state.branch.attrs.name,
            commit: SMC.state.branch.attrs.commit.sha
          });
        }
      })
      .then(function () {
        return promisify(SMC.state.build, 'build')({
          message: 'Initial Build'
        });
      })
      .then(function (build) {
        var opts = {
          masterPod: true,
          name: SMC.state.name,
          build: build.id(),
          owner: {
            github: $rootScope.dataApp.data.activeAccount.oauthId()
          },
          env: [],
          ipWhitelist: {
            enabled: false
          }
        };
        return fetchUser().then(function (user) {
          return promisify(user, 'createInstance')(opts);
        });

      })
      .then(function instanceSetHandler (instance) {
        if (instance) {
          SMC.instance = instance;
          SMC.state.instance = instance;
          // Reset the opts, in the same way as `EditServerModalController`
          SMC.state.opts  = {
            env: keypather.get(instance, 'attrs.env') || [],
            ipWhitelist: angular.copy(keypather.get(instance, 'attrs.ipWhitelist')) || {
              enabled: false
            }
          };
          return instance;
        }
        return $q.reject(new Error('Instance not created properly'));
      })
      .then(function () {
        eventTracking.createdRepoContainer(SMC.instance.attrs.owner.github, SMC.state.repo.attrs.name);
        return SMC.resetStateContextVersion(SMC.instance.contextVersion, true);
      })
      .catch(function (err) {
        // If creating the server fails, reset the context version
        return SMC.resetStateContextVersion(SMC.state.contextVersion, false)
          .then(function () {
            // Since we failed to build, we need loading promises to have something in it
            loadingPromises.add(SMC.name, $q.when(true));
            return $q.reject(err);
          });
      });
  };

 /**
   * This function determines if a tab chooser should be shown
   *
   * @param tabname
   * @returns {Boolean}
   */
  SMC.isTabVisible = function (tabName) {
    if (!SMC.TAB_VISIBILITY[tabName]) {
      return false;
    }
    if (SMC.TAB_VISIBILITY[tabName].featureFlagName && !$rootScope.featureFlags[SMC.TAB_VISIBILITY[tabName].featureFlagName]) {
      return false;
    }
    if (SMC.state.isMirroingDockerfile) {
      return SMC.TAB_VISIBILITY[tabName].mirror;
    }
    if (SMC.state.advanced) {
      return SMC.TAB_VISIBILITY[tabName].advanced;
    }
    return false;
  };

  SMC.isPrimaryButtonDisabled = function (serverFormInvalid) {
    return SMC.repositoryForm && SMC.repositoryForm.$invalid;
  };

  SMC.needToBeDirtyToSaved = function () {
    if (!SMC.instance) {
      return false;
    }
    return true;
  };

}
