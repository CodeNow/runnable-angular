'use strict';

require('app')
  .controller('ServerModalController', ServerModalController);

function ServerModalController(
  $filter,
  $q,
  $rootScope,
  $scope,
  eventTracking,
  errs,
  helpCards,
  parseDockerfileForCardInfoFromInstance,
  createBuildFromContextVersionId,
  keypather,
  loadingPromises,
  promisify,
  ModalService,
  updateDockerfileFromState
) {
  this.openDockerfile = function (state, openItems) {
    return promisify(state.contextVersion, 'fetchFile')('/Dockerfile')
      .then(function (dockerfile) {
        if (state.dockerfile) {
          openItems.remove(state.dockerfile);
        }
        if (dockerfile) {
          openItems.add(dockerfile);
        }
        state.dockerfile = dockerfile;
      });
  };

  this.isDirty = function () {
    // Loading promises are clear when the modal is saved or cancelled.
    var SMC = this;
    var requiresBuild = loadingPromises.count(SMC.name) > 0 || !SMC.openItems.isClean() ? 'build' : false;
    var requiresUpdate = !angular.equals(
      keypather.get(SMC, 'instance.attrs.env') || [],
      keypather.get(SMC, 'state.opts.env') || []
    ) ? 'update' : false;
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
      .then(function (promiseArrayLength) {
        loadingPromises.clear(SMC.name);
        toRebuild = !!(
          forceRebuild ||
          promiseArrayLength > 0 ||
          SMC.openItems.getAllFileModels(true).length
        );

        toRedeploy = !toRebuild && !angular.equals(
          keypather.get(SMC, 'instance.attrs.env'),
          keypather.get(SMC, 'state.opts.env')
        );

        // If we are redeploying and the build is not finished we need to rebuild or suffer errors from API.
        if (toRedeploy && ['building', 'buildFailed', 'neverStarted'].includes(keypather.get(SMC, 'instance.status()'))) {
          toRedeploy = false;
          toRebuild = true;
        }

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
          })
          .then(function () {
            loadingPromises.clear(SMC.name, true);
          })
          .catch(function (err) {
            // If we get an error, we need to wipe the loadingPromises, since it could have an error
            loadingPromises.clear(SMC.name, true);
            return $q.reject(err);
          });
      });
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
        instance: SMC.instance
      }
    })
      .then(function (modal) {
        modal.close.then(function (state) {
          if (state) {
            var promise = (state === 'build') ? SMC.getUpdatePromise() : $q.when(true);
            return promise
              .then(function () {
                loadingPromises.clear(SMC.name);
                close();
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
    SMC.state.promises.contextVersion = loadingPromises.start(
      SMC.name,
      promisify(contextVersion, 'deepCopy')()
        .then(function (contextVersion) {
          SMC.state.contextVersion = contextVersion;
          SMC.state.acv = contextVersion.getMainAppCodeVersion();
          SMC.state.repo = keypather.get(contextVersion, 'getMainAppCodeVersion().githubRepo');
          return promisify(contextVersion, 'fetch')();
        })
    );

    return SMC.state.promises.contextVersion
      .then(function (contextVersion) {
        // Only parse the Dockerfile info when no error has occurred
        if (shouldParseDockerfile  && !SMC.state.advanced) {
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

  this.updateInstanceAndReset = function () {
    var SMC = this;
    return this.getUpdatePromise()
      .then(function () {
        return SMC.resetStateContextVersion(SMC.state.contextVersion, false);
      })
      .catch(errs.handler);
  };

  this.getUpdatePromise = function () {
    var SMC = this;
    return this.saveInstanceAndRefreshCards()
      .catch(function (err) {
        errs.handler(err);
        return SMC.resetStateContextVersion(SMC.state.contextVersion, false);
      });
  };

  this.changeTab = function (tabname) {
    if (!this.state.advanced) {
      if ($filter('selectedStackInvalid')(this.state.selectedStack)) {
        tabname = 'repository';
      } else if (!this.state.startCommand && tabname !== 'repository') {
        tabname = 'commands';
      }
    } else if (keypather.get($scope, 'SMC.serverForm.$invalid')) {
      if (keypather.get($scope, 'SMC.serverForm.$error.required.length')) {
        var firstRequiredError = $scope.SMC.serverForm.$error.required[0].$name;
        tabname = firstRequiredError.split('.')[0];
      }
    }
    if (!this.instance && this.state.step === 2 && tabname === 'repository') {
      this.state.step = 1;
      $scope.$broadcast('updateStep', this.state.step);
    }
    this.selectedTab = tabname;
  };
}
