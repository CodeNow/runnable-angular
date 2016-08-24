'use strict';

require('app')
  .controller('SetupMirrorServerModalController', SetupMirrorServerModalController);

function SetupMirrorServerModalController(
  $scope,
  $controller,
  $q,
  $rootScope,
  cardInfoTypes,
  createAndBuildNewContainer,
  createBuildFromContextVersionId,
  errs,
  eventTracking,
  fetchUser,
  helpCards,
  isTabNameValid,
  keypather,
  loading,
  loadingPromises,
  ModalService,
  promisify,
  OpenItems,
  TAB_VISIBILITY,
  updateDockerfileFromState,
  close,
  instanceName,
  repo,
  build,
  masterBranch
) {
  var SMC = this; // Server Modal Controller (shared with EditServerModalController)
  SMC.helpCards = helpCards;

  var parentController = $controller('ServerModalController as SMC', { $scope: $scope });
  angular.extend(SMC, {
    'closeWithConfirmation': parentController.closeWithConfirmation.bind(SMC),
    'changeTab': parentController.changeTab.bind(SMC),
    'disableMirrorMode': parentController.disableMirrorMode.bind(SMC),
    'enableMirrorMode': parentController.enableMirrorMode.bind(SMC),
    'getDisplayName': parentController.getDisplayName.bind(SMC),
    'getElasticHostname': parentController.getElasticHostname.bind(SMC),
    'getNumberOfOpenTabs': parentController.getNumberOfOpenTabs.bind(SMC),
    'getUpdatePromise': parentController.getUpdatePromise.bind(SMC),
    'insertHostName': parentController.insertHostName.bind(SMC),
    'isDirty': parentController.isDirty.bind(SMC),
    'openDockerfile': parentController.openDockerfile.bind(SMC),
    'populateStateFromData': parentController.populateStateFromData.bind(SMC),
    'rebuildAndOrRedeploy': parentController.rebuildAndOrRedeploy.bind(SMC),
    'requiresRebuild': parentController.requiresRebuild.bind(SMC),
    'requiresRedeploy': parentController.requiresRedeploy.bind(SMC),
    'resetStateContextVersion': parentController.resetStateContextVersion.bind(SMC),
    'saveInstanceAndRefreshCards': parentController.saveInstanceAndRefreshCards.bind(SMC),
    'switchBetweenAdvancedAndMirroring': parentController.switchBetweenAdvancedAndMirroring.bind(SMC),
    'switchToMirrorMode': parentController.switchToMirrorMode.bind(SMC),
    'switchToAdvancedMode': parentController.switchToAdvancedMode.bind(SMC),
    'updateInstanceAndReset': parentController.updateInstanceAndReset.bind(SMC),
  });

  var mainRepoContainerFile = new cardInfoTypes.MainRepository();
  // Set initial state
  angular.extend(SMC, {
    name: 'setupMirrorServerModal',
    isLoading: $rootScope.isLoading,
    portsSet: false,
    isNewContainer: true,
    openItems: new OpenItems(),
    state: {
      advanced: 'isMirroringDockerfile',
      containerFiles: [
        mainRepoContainerFile
      ],
      mainRepoContainerFile: mainRepoContainerFile,
      packages: new cardInfoTypes.Packages(),
      promises: {},
      opts: {
        masterPod: true,
        name: instanceName,
        env: [],
        ipWhitelist: {
          enabled: false
        },
        isTesting: false
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
    repoSelected: true
  });

  SMC.state.mainRepoContainerFile.name = repo.attrs.name;
  SMC.state.promises.contextVersion = $q.when(SMC.state.contextVersion);

  var fullpath = keypather.get(SMC, 'state.build.contextVersion.attrs.buildDockerfilePath');
  if (!fullpath) {
    throw new Error('Context Version must have buildDockerfilePath');
  }
  loading(SMC.name, true);
  SMC.openDockerfile(SMC.state, SMC.openItems)
    .finally(function () {
      loading(SMC.name, false);
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
        return createAndBuildNewContainer($q.all({ // This changes the infracodeversion
          build: SMC.state.build,
          opts: SMC.state.opts
        }), SMC.state.opts.name);
      })
      .then(function instanceSetHandler (instance) {
        if (instance) {
          SMC.instance = instance;
          SMC.state.instance = instance;
          SMC.state.instance.on('update', function() {
            var buildStatus = SMC.state.instance.status();
            var containerHostname = SMC.state.instance.getContainerHostname();
            $rootScope.$broadcast('buildStatusUpdated', {
              status: buildStatus,
              containerHostname: containerHostname
            });
            if (buildStatus === 'running') {
              console.log(SMC.page);
              SMC.page = 'run';
            }
          });
          // Reset the opts, in the same way as `EditServerModalController`
          SMC.state.opts  = {
            env: keypather.get(instance, 'attrs.env') || [],
            ipWhitelist: angular.copy(keypather.get(instance, 'attrs.ipWhitelist') || {
              enabled: false
            }),
            isTesting: keypather.get(instance, 'attrs.isTesting')
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
    // First, check if tab exists and tab FF is turned on (if applicable)
    if (!isTabNameValid(tabName)) {
      return false;
    }
    if (SMC.state.advanced === 'isMirroringDockerfile') {
      return !!TAB_VISIBILITY[tabName].mirror;
    }
    return !!TAB_VISIBILITY[tabName].advanced;
  };

  SMC.isPrimaryButtonDisabled = function (serverFormInvalid) {
    return !!(SMC.repositoryForm && SMC.repositoryForm.$invalid);
  };

  SMC.needsToBeDirtySaved = function () {
    return !!SMC.instance;
  };
}
