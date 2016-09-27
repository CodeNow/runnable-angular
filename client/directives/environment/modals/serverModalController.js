'use strict';

require('app')
  .controller('ServerModalController', ServerModalController);

function ServerModalController(
  $filter,
  $q,
  $rootScope,
  $scope,
  ahaGuide,
  createBuildFromContextVersionId,
  configUserContentDomain,
  errs,
  eventTracking,
  fetchDockerfileForContextVersion,
  keypather,
  ModalService,
  loading,
  loadingPromises,
  parseDockerfileForCardInfoFromInstance,
  promisify,
  updateDockerfileFromState
) {
  var parentController = this;
  this.isAddingFirstRepo = ahaGuide.isAddingFirstRepo;

  this.requiresRedeploy = function () {
    var SMC = this;
    return !!SMC.instance && !angular.equals(
      keypather.get(SMC, 'instance.attrs.ipWhitelist') || { enabled: false },
      keypather.get(SMC, 'state.opts.ipWhitelist') // SMC is pre-filled with a default of { enabled: false }
    );
  };
  this.requiresRebuild = function () {
    var SMC = this;
    return loadingPromises.count(SMC.name) > 0 || !SMC.openItems.isClean() ||
      !angular.equals(
        keypather.get(SMC, 'instance.attrs.env') || [],
        keypather.get(SMC, 'state.opts.env') // SMC is pre-filled with a default of []
      ) ||
      (!!SMC.instance && (keypather.get(SMC, 'instance.attrs.isTesting') || false) !== keypather.get(SMC, 'state.opts.isTesting'));
  };

  this.openDockerfile = function (state, openItems) {
    var SMC = this;
    return fetchDockerfileForContextVersion(state.contextVersion)
      .then(function (dockerfile) {
        if (keypather.get(SMC, 'instance.hasDockerfileMirroring()') && !SMC.instance.mirroredDockerfile) {
          SMC.instance.mirroredDockerfile = dockerfile;
        }
        if (state.dockerfile) {
          openItems.remove(state.dockerfile);
        }
        if (dockerfile) {
          openItems.add(dockerfile);
        }
        state.dockerfile = dockerfile;
        return dockerfile;
      });
  };

  this.isDirty = function () {
    // Loading promises are clear when the modal is saved or cancelled.
    var SMC = this;
    var requiresUpdate = SMC.requiresRedeploy() ? 'update' : false;
    var requiresBuild = SMC.requiresRebuild() ? 'build' : false;
    if (requiresUpdate && (['building', 'buildFailed', 'neverStarted'].includes(keypather.get(SMC, 'instance.status()')))) {
      requiresBuild = 'build';
    }
    return requiresBuild || requiresUpdate;
  };

  this.rebuildAndOrRedeploy = function (noCache, forceRebuild) {
    var SMC = this;
    if (!noCache) {
      noCache = false;
    }
    if (!forceRebuild) {
      forceRebuild = false;
    }
    var toRebuild;
    var toRedeploy;
    // So we should do this watchPromise step first so that any tab that relies on losing focus
    // to change something will have enough time to add its promises to LoadingPromises
    return SMC.state.promises.contextVersion
      .then(function () {
        // Wait until all changes to the context version have been resolved to
        // rebuild and/or redeploy the instance
        return loadingPromises.finished(SMC.name);
      })
      .then(function () {
        // If we are redeploying and the build is not finished we need to rebuild or suffer errors from API.
        var rebuildOrRedeploy = SMC.isDirty();
        toRebuild = rebuildOrRedeploy === 'build' || forceRebuild;
        toRedeploy = !toRebuild && rebuildOrRedeploy === 'update';

        loadingPromises.clear(SMC.name);
        if (!SMC.openItems.isClean() || SMC.state.advanced === 'blankDockerfile') {
          return SMC.openItems.updateAllFiles();
        }
      })
      .then(function () {
        // Nothing to do. Exit.
        if (!toRebuild && !toRedeploy) {
          return false;
        }
        // Rebuild and or redeploy
        return $q.when(true)
          .then(function () {
            if (toRebuild) {
              eventTracking.triggeredBuild(false);
              return promisify(SMC.state.build, 'build')({
                message: 'manual',
                noCache: !!noCache
              })
                .then(function (build) {
                  SMC.state.opts.build = build.id();
                  // Since the contextVersion could have deduped, we need to reset the state.cv
                  // to this build's cv.  If true, the duped cv has been deleted
                  SMC.state.contextVersion = build.contextVersions.models[0];
                  return SMC.state;
                });
            }
            return SMC.state;
          })
          .then(function (state) {
            /*!
             * Make sure not to update the owner of this instance. If we pass
             * the owner property, the API will try to update the owner of the
             * instance, which won't work because our `owner` property does not
             * have the `githubUsername` property.
             */
            var opts = angular.copy(state.opts);
            delete opts.owner;
            return promisify(SMC.instance, 'update')(opts);
          })
          .then(function () {
            if (toRedeploy) {
              return promisify(SMC.instance, 'redeploy')();
            }
          });
      })
      .catch(function (err) {
        // If we get an error, we need to wipe the loadingPromises, since it could have an error
        loadingPromises.clear(SMC.name, true);

        // Don't reset the CV unless we attempted to build
        if (toRebuild) {
          return SMC.resetStateContextVersion(SMC.state.contextVersion, false)
            .then(function () {
              // Since we failed to build, we need loading promises to have something in it again
              loadingPromises.add(SMC.name, $q.when(true));
              return $q.reject(err);
            });
        }

        return $q.reject(err);
      });
  };

  this.getNumberOfOpenTabs = function () {
    var tabs = [
      'repository',
      'commands',
      'whitelist',
      'ports',
      'env',
      'files',
      'translation',
      'buildfiles',
      'logs'
    ];
    var SMC = this;
    var count = tabs.filter(function (tabName) {
      return SMC.isTabVisible(tabName);
    }).length;
    if (count === tabs.length) {
      return 'tabs-all';
    }
    return 'tabs-' + count;
  };

  this.closeWithConfirmation = function (close) {
    var SMC = this;
    $rootScope.$broadcast('close-popovers');
    if (!SMC.isDirty()) {
      return close();
    }
    return ModalService.showModal({
      controller: 'ConfirmCloseServerController',
      controllerAs: 'CMC',
      templateUrl: 'confirmCloseServerView',
      inputs: {
        hasInstance: !!SMC.instance,
        shouldDisableSave: keypather.get(SMC, 'serverForm.$invalid')
      }
    })
      .then(function (modal) {
        modal.close.then(function (state) {
          if (state) {
            if (state === 'build' && keypather.get(SMC, 'serverForm.$invalid')) {
              return;
            }
            loading(SMC.name, true);
            return $q.when((state === 'build') ? SMC.getUpdatePromise() : true)
              .then(close)
              .catch(function (err) {
                errs.handler(err);
                loading(SMC.name, false);
              });
          }
        });
      });
  };

  this.populateStateFromData = function (data) {
    var SMC = this;
    if (typeof data.ports === 'string') {
      var portsStr = data.ports.replace(/,/gi, '');
      var ports = (portsStr || '').split(' ');
      // We need to keep the reference to the ports array
      if (SMC.state.ports.length > 0) {
        SMC.state.ports.splice(0, SMC.state.ports.length);
      }
      ports.forEach(function (port) {
        // After adding initially adding ports here, ports can no longer be
        // added/removed since they are managed by the `ports-form` directive
        // and will get overwritten.
        SMC.state.ports.push(port);
      });
    }

    // Once ports are set, start listening to changes
    if (!SMC.portsUnwatcher) {
      SMC.portsUnwatcher = $scope.$watchCollection(function () {
        return SMC.state.ports;
      }, parentController.onPortsChange.bind(SMC));
    }

    SMC.state.packages = data.packages;
    SMC.state.startCommand = data.startCommand;
    SMC.state.selectedStack = data.selectedStack;

    function mapContainerFiles(model) {
      var cloned = model.clone();
      if (model.type === 'Main Repository') {
        SMC.state.mainRepoContainerFile = cloned;
      }
      return cloned;
    }

    if (data.containerFiles) {
      SMC.state.containerFiles = data.containerFiles.map(mapContainerFiles);
    }
  };

  this.onPortsChange = function (newPortsArray, oldPortsArray) {
    var SMC = this;
    if (!SMC.state.advanced && !angular.equals(newPortsArray, oldPortsArray)) {
      // Only update the Dockerfile if the ports have actually changed
      loadingPromises.add(SMC.name, updateDockerfileFromState(SMC.state));
    }
  };

  this.hasOpenPorts = function() {
    return !!keypather.get(this, 'instance.attrs.container.ports');
  };

  this.onEnvChange = function (newEnvArray, oldEnvArray) {
    var SMC = this;
    if (!newEnvArray) { return; }
    if (!SMC.state.advanced && !angular.equals(newEnvArray, oldEnvArray)) {
      // Only update the Dockerfile if the envs have actually changed
      loadingPromises.add(SMC.name, updateDockerfileFromState(SMC.state));
    }
  };

  this.resetStateContextVersion = function (contextVersion, shouldParseDockerfile) {
    var SMC = this;

    if (SMC.state.advanced !== 'blankDockerfile') {
      if (keypather.get(contextVersion, 'attrs.buildDockerfilePath')) {
        SMC.state.advanced = 'isMirroringDockerfile';
      } else {
        SMC.state.advanced = !!keypather.get(contextVersion, 'attrs.advanced');
      }
    }

    SMC.state.promises.contextVersion = loadingPromises.start(
      SMC.name,
      promisify(contextVersion, 'deepCopy')()
        .then(function (newCv) {
          SMC.state.contextVersion = newCv;
          SMC.state.acv = newCv.getMainAppCodeVersion();
          SMC.state.repo = keypather.get(newCv, 'getMainAppCodeVersion().githubRepo');
          return promisify(newCv, 'fetch')();
        })
    );

    return SMC.state.promises.contextVersion
      .then(function (contextVersion) {
        // Only parse the Dockerfile info when no error has occurred
        if (shouldParseDockerfile && !SMC.state.advanced) {
          return parseDockerfileForCardInfoFromInstance(SMC.instance, contextVersion)
            .then(function (data) {
              angular.extend(SMC, data);
              SMC.populateStateFromData(data, contextVersion);
              return contextVersion;
            });
        }
        return contextVersion;
      })
      .then(function (contextVersion) {
        SMC.openItems.removeAndReopen(contextVersion);
        return SMC.openDockerfile(SMC.state, SMC.openItems);
      })
      .then(function () {
        return createBuildFromContextVersionId(SMC.state.contextVersion.id());
      })
      .then(function (build) {
        SMC.state.build = build;
        return SMC.state.contextVersion;
      });
  };

  this.insertHostName = function (opts) {
    if (!opts) {
      return;
    }
    var hostName = '';
    if (opts.protocol) {
      hostName += opts.protocol;
    }
    if (opts.server) {
      hostName += opts.server.getElasticHostname();
    }
    if (opts.port) {
      hostName += ':' + opts.port;
    }
    $rootScope.$broadcast('eventPasteLinkedInstance', hostName);
  };

  this.saveInstanceAndRefreshCards = function () {
    var SMC = this;
    $rootScope.$broadcast('close-popovers');
    return SMC.rebuildAndOrRedeploy()
      .then(function () {
        $rootScope.$broadcast('alert', {
          type: 'success',
          text: 'Changes Saved'
        });
        return true;
      });
  };

  this.handleInstanceUpdate = function () {
    var buildStatus = this.instance.status();
    $rootScope.$broadcast('buildStatusUpdated', {
      status: buildStatus
    });
    if (buildStatus === 'running') {
      this.page = 'run';
    }
  };

  this.switchToMirrorMode = function (state, openItems, dockerfile) {
    var SMC = this;
    return loadingPromises.add(SMC.name, promisify(state.contextVersion, 'update')({
      advanced: true,
      buildDockerfilePath: dockerfile.path
    }))
      .then(function () {
        state.advanced = 'isMirroringDockerfile';
        return SMC.resetStateContextVersion(state.contextVersion, false);
      });
  };

  this.switchToAdvancedMode = function (state, openItems) {
    var SMC = this;
    var errorMessage = '';
    errorMessage += '# There was an error retrieving the Dockerfile from your repo';
    errorMessage += '# This error occured when disabling mirroring your Dockerfile';
    var dockerfileBody = keypather.get(state, 'dockerfile.attrs.body') || errorMessage;
    return loadingPromises.add(SMC.name, promisify(state.contextVersion, 'update')({
      advanced: true,
      buildDockerfilePath: null
    }))
      .then(function () {
        return SMC.openDockerfile(state, openItems);
      })
      .then(function () {
        state.advanced = true;
        return SMC.resetStateContextVersion(state.contextVersion, false);
      })
      .then(function () {
        return promisify(state.dockerfile, 'update')({
          json: {
            body: dockerfileBody
          }
        });
      });
  };

  this.enableMirrorMode = function () {
    var SMC = this;
    var branchName = keypather.get(SMC, 'state.contextVersion.getMainAppCodeVersion().attrs.branch');
    return ModalService.showModal({
      controller: 'ChooseDockerfileModalController',
      controllerAs: 'MC', // Shared
      templateUrl: 'changeMirrorView',
      inputs: {
        repo: SMC.state.repo,
        branchName: branchName
      }
    })
      .then(function (modal) {
        return modal.close;
      })
      .then(function (dockerfile) {
        if (dockerfile) {
          loading(SMC.name, true);
          return SMC.switchToMirrorMode(SMC.state, SMC.openItems, dockerfile)
            .catch(errs.handler)
            .finally(function () {
              loading(SMC.name, false);
            });
        }
      });
  };

  this.disableMirrorMode = function () {
    var SMC = this;
    loading(SMC.name, true);
    return SMC.switchToAdvancedMode(SMC.state, SMC.openItems)
      .catch(errs.handler)
      .finally(function () {
        loading(SMC.name, false);
      });
  };

  this.showAdvancedModeConfirm = function () {
    var SMC = this;
    return ModalService.showModal({
      controller: 'ConfirmationModalController',
      controllerAs: 'CMC', // Shared
      templateUrl: 'confirmSetupAdvancedModalView'
    })
      .then(function (modal) {
        return modal.close;
      })
      .then(function (confirmed) {
        if (confirmed) {
          loading(SMC.name, true);
          return SMC.switchToAdvancedMode(SMC.state, SMC.openItems)
            .catch(errs.handler)
            .finally(function () {
              loading(SMC.name, false);
            });
        }
      });
  };

  /*!
   * Getter/Setter for whether instance is mirroring dockerfile
   * @returns {Promise|Boolean}
   */
  this.switchBetweenAdvancedAndMirroring = function (newIsMirrorMode) {
    var SMC = this;
    if (newIsMirrorMode === false) {
      return SMC.disableMirrorMode()
        .then(function () {
          return SMC.state.advanced === 'isMirroringDockerfile';
        });
    }
    if (newIsMirrorMode === true) {
      return SMC.enableMirrorMode()
        .then(function () {
          return SMC.state.advanced === 'isMirroringDockerfile';
        });
    }
    return SMC.state.advanced === 'isMirroringDockerfile';
  };

  this.getDisplayName = function () {
    var SMC = this;
    if (SMC.instance) {
      return SMC.instance.getDisplayName();
    }
    return SMC.state.repo.attrs.name;
  };

  this.getElasticHostname = function () {
    var SMC = this;
    if (keypather.get(SMC, 'state.repo.attrs')) {
      // NOTE: Is SMC the best way to get the hostname?
      var repo = SMC.state.repo;
      var repoName = repo.attrs.name;
      var repoOwner = repo.attrs.owner.login.toLowerCase();
      return repoName + '-staging-' + repoOwner + '.' + configUserContentDomain;
    }
    return '';
  };

  /**
   * Updates the current instance
   * @returns {Promise} Resolves when the instance update has been started, and the cv has been
   *        reset.  The error is uncaught, so a catch should be added to this
   */
  this.updateInstanceAndReset = function () {
    var SMC = this;
    return SMC.getUpdatePromise()
      .then(function () {
        return SMC.resetStateContextVersion(SMC.instance.contextVersion, true);
      });
  };

  /**
   * Updates the this.instance with all the states, emits the Changes Saved alert.
   * If a failure occurs, the cv is reset, and the error propagates.
   * @returns {Promise} Resolves when the instance update has been started, and the cv has been
   *        reset.  The error is uncaught, so a catch should be added to this
   */
  this.getUpdatePromise = this.saveInstanceAndRefreshCards;

  this.changeTab = function (tabname) {
    $rootScope.$broadcast('updatedTab', tabname);
    var SMC = this;
    if (keypather.get(SMC, 'serverForm.$invalid')) {
      if (keypather.get(SMC, 'serverForm.$error.required.length')) {
        var firstRequiredError = SMC.serverForm.$error.required[0].$name;
        tabname = firstRequiredError.split('.')[0];
      }
    }
    if (!SMC.state.advanced && !SMC.state.isNonRepoContainer) {
      if ($filter('selectedStackInvalid')(SMC.state.selectedStack)) {
        tabname = 'repository';
      } else if (!SMC.state.startCommand) {
        tabname = 'commands';
      }
    }
    if (!SMC.instance && SMC.state.step === 2 && tabname === 'repository') {
      SMC.state.step = 1;
    }
    SMC.selectedTab = tabname;
  };
}
