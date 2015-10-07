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
  parseDockerfileForCardInfoFromInstance,
  keypather,
  loading,
  loadingPromises,
  promisify
) {

  this.openDockerfile = function () {
    var SMC = this;
    return promisify(SMC.state.contextVersion, 'fetchFile')('/Dockerfile')
      .then(function (dockerfile) {
        if (SMC.state.dockerfile) {
         SMC.openItems.remove(SMC.state.dockerfile);
        }
        if (dockerfile) {
          SMC.openItems.add(dockerfile);
        }
        SMC.state.dockerfile = dockerfile;
      });
  };

  this.isDirty = function  () {
    /*!
     *  Loading promises are clear when the modal is saved or cancelled.
     */
    var SMC = this;
    return loadingPromises.count(SMC.name) > 0 ||
      !angular.equals(
        keypather.get(SMC, 'instance.attrs.env'),
        keypather.get(SMC, 'state.opts.env')
      ) ||
      !SMC.openItems.isClean();
  };

  this.rebuildAndOrRedeploy = function () {
    var SMC = this;
    var toRebuild;
    var toRedeploy;
    // So we should do this watchPromise step first so that any tab that relies on losing focus
    // to change something will have enough time to add its promises to LoadingPromises
    return SMC.state.promises.contextVersion
      .then(function () {
        return loadingPromises.finished(SMC.name);
      })
      .then(function (promiseArrayLength) {
        // Since the initial deepCopy should be in here, we only care about > 1
        toRebuild = !!(promiseArrayLength > 0 || SMC.openItems.getAllFileModels(true).length);

        toRedeploy = !toRebuild && !angular.equals(
          keypather.get(SMC, 'instance.attrs.env'),
          keypather.get(SMC, 'state.opts.env')
        );

        // If we are redeploying and the build is not finished we need to rebuild or suffer errors from API.
        if (toRedeploy && ['building', 'buildFailed', 'neverStarted'].includes(keypather.get(SMC, 'instance.status()'))) {
          console.log('Build is not finished!');
          toRedeploy = false;
          toRebuild = true;
        }
        console.log('toRebuild', toRebuild);
        console.log('toRedeploy', toRedeploy);

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
              console.log('Build build');
              eventTracking.triggeredBuild(false);
              return promisify(SMC.state.build, 'build')({ message: 'manual' })
                .then(function (build) {
                  SMC.state.opts.build = build.id();
                  return SMC.state;
                });
            }
            return SMC.state;
          })
          .then(function (state) {
            console.log('Update instance');
            return promisify(SMC.instance, 'update')(state.opts);
          })
          .then(function () {
            if (toRedeploy) {
              console.log('Redeploy instance');
              return promisify(SMC.instance, 'redeploy')();
            }
          });
      });
  };
  
  this.afterParsingDockerfile = function (data, contextVersion) {
    var SMC = this;
    Object.keys(data).forEach(function (key) {
      SMC.instance[key] = data[key];
    });
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
        SMC.updateDockerfileFromState();
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

  this.resetStateContextVersion = function (contextVersion, showSpinner) {
    var SMC = this;
    loading.reset(SMC.name);
    if (showSpinner) {
      loading(SMC.name, true);
    }
    SMC.state.advanced = keypather.get(contextVersion, 'attrs.advanced') || false;
    SMC.state.promises.contextVersion = loadingPromises.add(
      SMC.name,
      promisify(contextVersion, 'deepCopy')()
        .then(function (contextVersion) {
          SMC.state.contextVersion = contextVersion;
          SMC.state.acv = contextVersion.getMainAppCodeVersion();
          SMC.state.repo = keypather.get(contextVersion, 'getMainAppCodeVersion().githubRepo');
          return promisify(contextVersion, 'fetch')();
        })
    );
    // We only set showSpinner to true when an error has not occurred, so we should only
    // parse dockerfile info when this is true
    if (showSpinner) {
      SMC.state.promises.contextVersion
        .then(function (contextVersion) {
          return parseDockerfileForCardInfoFromInstance(SMC.instance, contextVersion)
            .then(function (data) {
              return SMC.afterParsingDockerfile(data, contextVersion);
            });
        })
        .then(function () {
          loading(SMC.name, false);
        });
    }

    return SMC.state.promises.contextVersion
      .then(function () {
        return SMC.openDockerfile();
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
      })
      .catch(function (err) {
        errs.handler(err);
      });
  };



}

