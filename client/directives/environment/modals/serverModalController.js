'use strict';

require('app')
  .controller('ServerModalController', ServerModalController);

function ServerModalController (
  $q,
  $rootScope,
  $scope,
  eventTracking,
  errs,
  fetchUser,
  helpCards,
  parseDockerfileForCardInfoFromInstance,
  keypather,
  loading,
  loadingPromises,
  promisify,
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

  this.isDirty = function  () {
    // Loading promises are clear when the modal is saved or cancelled.
    var SMC = this;
    // If there is no CV, there can be no changes
    if (!SMC.state.contextVersion) {
      return false;
    }
    return loadingPromises.count(SMC.name) > 0 ||
      !angular.equals(
        keypather.get(SMC, 'instance.attrs.env') || [],
        keypather.get(SMC, 'state.opts.env') || []
      ) ||
      !SMC.openItems.isClean();
  };

  this.rebuildAndOrRedeploy = function (noCache) {
    var SMC = this;
    if (!noCache) {
      noCache = false;
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
        toRebuild = !!(promiseArrayLength > 0 || SMC.openItems.getAllFileModels(true).length);

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
    $scope.$watchCollection(function () {
      return SMC.state.ports;
    }, function (newPortsArray, oldPortsArray) {
      if (!angular.equals(newPortsArray, oldPortsArray)) {
        // Only update the Dockerfile if the ports have actually changed
        updateDockerfileFromState(SMC.state, true, true);
      }
    });

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
    SMC.state.promises.contextVersion = loadingPromises.add(
      SMC.name,
      promisify(contextVersion, 'deepCopy')()
        .then(function (contextVersion) {
          SMC.state.contextVersion = contextVersion;
          SMC.state.acv = contextVersion.getMainAppCodeVersion();
          SMC.state.repo = keypather.get(contextVersion, 'getMainAppCodeVersion().githubRepo');
          loadingPromises.clear(SMC.name);
          return promisify(contextVersion, 'fetch')();
        })
    );
    // Only parse the Dockerfile info when no error has occurred
    if (shouldParseDockerfile) {
      SMC.state.promises.contextVersion
        .then(function (contextVersion) {
          return parseDockerfileForCardInfoFromInstance(SMC.instance, contextVersion)
            .then(function (data) {
              angular.extend(SMC, data);
              return SMC.populateStateFromData(data, contextVersion);
            });
        });
    }

    return SMC.state.promises.contextVersion
      .then(function () {
        return SMC.openDockerfile(SMC.state, SMC.openItems);
      })
      .then(function () {
        return fetchUser();
      })
      .then(function (user) {
        return promisify(user, 'createBuild')({
          contextVersions: [SMC.state.contextVersion.id()],
          owner: {
            github: $rootScope.dataApp.data.activeAccount.oauthId()
          }
        });
      })
      .then(function (build) {
        SMC.state.build = build;
        return SMC;
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
          text: 'Container updated successfully.'
        });
        return true;
      });
  };

}

