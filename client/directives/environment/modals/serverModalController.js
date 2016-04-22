'use strict';

require('app')
  .controller('ServerModalController', ServerModalController);

var TAB_VISIBILITY = {
  repository:  {
    advanced: true,
    basic: true,
    mirror: true,
    step: 1
  },
  commands:  {
    basic: true,
    step: 2
  },
  ports:  {
    basic: true,
    step: 3
  },
  whitelist: {
    advanced: true,
    basic: true,
    mirror: true,
    featureFlagName: 'whitelist',
    nonRepo: true,
    step: 3
  },
  env:  {
    advanced: true,
    basic: true,
    mirror: true,
    nonRepo: true,
    step: 3
  },
  backup: {
    featureFlagName: 'backup',
    nonRepo: true,
    step: 3
  },
  files:  {
    basic: true,
    step: 3
  },
  translation:  {
    advanced: true,
    basic: true,
    step: 3
  },
  buildfiles: {
    basic: true,
    advanced: true,
    mirror: true,
    nonRepo: true,
    step: 3
  },
  logs: {
    advanced: true,
    basic: true,
    nonRepo: true,
    mirror: true,
    step: 4
  }
};

function ServerModalController(
  $filter,
  $q,
  $rootScope,
  $scope,
  base64,
  errs,
  eventTracking,
  fetchRepoDockerfiles,
  helpCards,
  parseDockerfileForCardInfoFromInstance,
  createBuildFromContextVersionId,
  keypather,
  hasKeypaths,
  loading,
  loadingPromises,
  promisify,
  ModalService,
  updateDockerfileFromState
) {
  this.TAB_VISIBILITY = TAB_VISIBILITY;

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
      );
  };

  this.openDockerfile = function (state, openItems) {
    var SMC = this;
    return $q.when(true)
      .then(function () {
        var buildDockerfilePath = keypather.get(state, 'contextVersion.attrs.buildDockerfilePath');
        var acv = state.contextVersion.getMainAppCodeVersion();
        var repoFullName = keypather.get(acv, 'attrs.repo');
        if (buildDockerfilePath && repoFullName) {
          // Get everything before the last '/' and add a '/' at the end
          var path = buildDockerfilePath.replace(/^(.*)\/.*$/, '$1') + '/';
          // Get everything after the last '/'
          var name = buildDockerfilePath.replace(/^.*\/(.*)$/, '$1');
          var branchName = keypather.get(acv, 'attrs.branch');
          return fetchRepoDockerfiles(repoFullName, branchName)
            .then(function (dockerfiles) {
              var dockerfile = dockerfiles[0];
              return SMC.state.contextVersion.newFile({
                _id: dockerfile.sha,
                id: dockerfile.sha,
                body: base64.decode(dockerfile.content),
                name: name,
                path: path
              });
            });
        }
        return promisify(state.contextVersion, 'fetchFile')('/Dockerfile');
      })
      .then(function (dockerfile) {
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
        if (!SMC.openItems.isClean()) {
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
      'logs',
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

  this.populateStateFromData = function (data, contextVersion) {
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
      }, function (newPortsArray, oldPortsArray) {
        if (!angular.equals(newPortsArray, oldPortsArray)) {
          // Only update the Dockerfile if the ports have actually changed
          loadingPromises.add(SMC.name, updateDockerfileFromState(SMC.state, true, true));
        }
      });
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

  this.resetStateContextVersion = function (contextVersion, shouldParseDockerfile) {
    var SMC = this;
    SMC.state.advanced = keypather.get(contextVersion, 'attrs.advanced') || false;
    SMC.state.isMirroringDockerfile = !!keypather.get(contextVersion, 'attrs.buildDockerfilePath') || false;
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
    var SMC = this;
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
        helpCards.refreshActiveCard();
        $rootScope.$broadcast('alert', {
          type: 'success',
          text: 'Changes Saved'
        });
        return true;
      });
  };

  this.switchToMirrorMode = function (state, openItems, dockerfile) {
    var SMC = this;
    return loadingPromises.add(SMC.name, promisify(state.contextVersion, 'update')({
        advanced: true,
        buildDockerfilePath: dockerfile.path
      }))
      .then(function () {
        state.advanced = true;
        state.isMirroringDockerfile = true;
        return SMC.resetStateContextVersion(state.contextVersion, false);
      });
  };

  this.switchToAdvancedMode = function (state, openItems) {
    var SMC = this;
    var dockerfileBody = state.dockerfile.attrs.body;
    return loadingPromises.add(SMC.name, promisify(state.contextVersion, 'update')({
      advanced: true,
      buildDockerfilePath: null
    }))
    .then(function () {
      return SMC.openDockerfile(state, openItems);
    })
    .then(function () {
      state.advanced = true;
      state.isMirroringDockerfile = false;
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
        return;
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
        return;
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
          return SMC.state.isMirroringDockerfile;
        });
    }
    if (newIsMirrorMode === true) {
      return SMC.enableMirrorMode()
        .then(function () {
          return SMC.state.isMirroringDockerfile;
        });
    }
    return SMC.state.isMirroringDockerfile;
  };

  this.isTabVisible = function (tabName) {
    var SMC = this;
    if (!SMC.TAB_VISIBILITY[tabName]) {
      return false;
    }
    if (SMC.TAB_VISIBILITY[tabName].featureFlagName && !$rootScope.featureFlags[SMC.TAB_VISIBILITY[tabName].featureFlagName]) {
      return false;
    }
    return true;
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
      var domain = SMC.state.repo.opts.userContentDomain;
      // NOTE: How can I know whether it will be staging or not?
      var hostname = repoName + '-staging-' + repoOwner + '.' + domain;
      return hostname;
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
   * Updates the this.instance with all the states, emits the Changes Saved alert, and refreshes the
   *  help cards.  If a failure occurs, the cv is reset, and the error propagates.
   * @returns {Promise} Resolves when the instance update has been started, and the cv has been
   *        reset.  The error is uncaught, so a catch should be added to this
   */
  this.getUpdatePromise = this.saveInstanceAndRefreshCards;

  this.changeTab = function (tabname) {
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
