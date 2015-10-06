'use strict';

require('app')
  .controller('EditServerModalController', EditServerModalController);

var tabVisibility = {
  buildfiles: { advanced: true, nonRepo: true, basic: false },
  repository:  { advanced: false, nonRepo: false, basic: true },
  ports:  { advanced: false, nonRepo: false, basic: true },
  env:  { advanced: true, nonRepo: true, basic: true },
  commands:  { advanced: false, nonRepo: false, basic: true },
  files:  { advanced: false, nonRepo: false, basic: true },
  translation:  { advanced: true, nonRepo: false, basic: true },
  logs:  { advanced: true, nonRepo: true, basic: true }
};

/**
 * @ngInject
 */
function EditServerModalController(
  $scope,
  $controller,
  $q,
  $filter,
  $rootScope,
  errs,
  eventTracking,
  fetchInstancesByPod,
  fetchStackInfo,
  fetchSourceContexts,
  fetchUser,
  findLinkedServerVariables,
  hasKeypaths,
  helpCards,
  keypather,
  loading,
  loadingPromises,
  OpenItems,
  parseDockerfileForCardInfoFromInstance,
  promisify,
  updateDockerfileFromState,
  ModalService,
  tab,
  instance,
  actions,
  close
) {
  var SMC = this;

  angular.extend(SMC, $controller('ServerModalController as SMC', { $scope: $scope }));

  SMC.instance = instance;
  SMC.selectedTab = tab;
  angular.extend(SMC, {
    name: 'editServerModal',
    showDebugCmd: false,
    data: {},
    state:  {
      ports: [],
      opts: {
        env: keypather.get(instance, 'attrs.env') || []
      },
      promises: {},
      instance: instance,
      newLink: {}
    },
    validation: {
      env: null
    },
    openItems: new OpenItems(),
    startCommand: function () {
      var cmd = keypather.get(SMC, 'instance.containers.models[0].attrs.inspect.Config.Cmd[2]');
      cmd = cmd || '';
      return cmd.replace('until grep -q ethwe /proc/net/dev; do sleep 1; done;', '');
    },
    actions: angular.extend(actions, {
      close: function () {
        $rootScope.$broadcast('close-popovers');
        if (isDirty() && !SMC.saveTriggered) {
          ModalService.showModal({
            controller: 'ConfirmationModalController',
            controllerAs: 'CMC',
            templateUrl: 'confirmCloseEditServer'
          })
            .then(function (modal) {
              modal.close.then(function (confirmed) {
                if ( confirmed ) {
                  close();
                }
              });
            })
            .catch(errs.handler);
        } else {
          close();
        }
      }
    }),
    build: instance.build,
    getElasticHostname: instance.getElasticHostname.bind(instance)
  });
  SMC.modalActions = SMC.actions;
  loading.reset(SMC.name);
  loading(SMC.name, true);

  fetchInstancesByPod()
    .then(function (instances) {
      SMC.data.instances = instances;
    });

  fetchStackInfo()
    .then(function (stackInfo) {
      SMC.data.stacks = stackInfo;
    });

  fetchSourceContexts()
    .then(function (contexts) {
      SMC.data.sourceContexts = contexts;
    });


  function isDirty () {
    /*!
     * The `1` in this line refers to the loading promise added by running
     * `resetContextVersion` when instanstiating this controller. Loading
     * promises are clear when the modal is saved or cancelled.
     */
    return loadingPromises.count(SMC.name) > 1 ||
      !angular.equals(
        keypather.get(SMC, 'instance.attrs.env'),
        keypather.get(SMC, 'state.opts.env')
      ) ||
      !SMC.openItems.isClean();
  }

  SMC.updateDockerfileFromState = function () {
    // Only update from state if not in advanced mode
    if (!keypather.get(SMC, 'instance.contextVersion.attrs.advanced')) {
      return loadingPromises.add(SMC.name, updateDockerfileFromState(SMC.state));
    }
  };

  $scope.$on('debug-cmd-status', function (evt, status) {
    SMC.showDebugCmd = status;
  });

  $scope.$watch(function () {
    return SMC.state.opts.env.join();
  }, function (n) {
    if (!n) { return; }
    SMC.linkedEnvResults = findLinkedServerVariables(SMC.state.opts.env);
  });

  function afterParsingDockerfile(data, contextVersion) {
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
  }

  SMC.resetStateContextVersion = function (contextVersion, showSpinner) {
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
              return afterParsingDockerfile(data, contextVersion);
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

  $scope.$on('resetStateContextVersion', function ($event, contextVersion, showSpinner) {
    $event.stopPropagation();
    SMC.resetStateContextVersion(contextVersion, showSpinner);
  });

  function resetState(instance, fromError) {
    loadingPromises.clear(SMC.name);
    return SMC.resetStateContextVersion(instance.contextVersion, !fromError);
  }

  SMC.changeTab = function (tabname) {
    if (!SMC.state.advanced) {
      if ($filter('selectedStackInvalid')(SMC.state.selectedStack)) {
        tabname = 'repository';
      } else if (!SMC.state.startCommand) {
        tabname = 'commands';
      }
    } else if ($scope.editServerForm.$invalid) {
      if (keypather.get($scope, 'editServerForm.$error.required.length')) {
        var firstRequiredError = $scope.editServerForm.$error.required[0].$name;
        tabname = firstRequiredError.split('.')[0];
      }
    }
    SMC.selectedTab = tabname;
  };
  /**
   * This function determines if a tab chooser should be shown
   *
   * Possibilities for currentStatuses are:
   *  advanced
   *  basic
   *  basic + nonRepo (Not used)
   *  advanced + nonRepo
   * @param tabname
   * @returns {*}
   */
  SMC.isTabVisible = function (tabname) {
    if (!tabVisibility[tabname]) {
      return false;
    }
    var currentStatuses = [];
    var currentContextVersion = keypather.get(SMC, 'instance.contextVersion');
    var stateAdvanced = keypather.get(SMC, 'state.advanced');

    if (!currentContextVersion.getMainAppCodeVersion()) {
      currentStatuses.push('nonRepo');
    }
    if (stateAdvanced ||
        (!keypather.get(SMC, 'state.contextVersion') && keypather.get(currentContextVersion, 'attrs.advanced'))) {
      currentStatuses.push('advanced');
    } else {
      currentStatuses.push('basic');
    }
    return currentStatuses.every(function (status) {
      return tabVisibility[tabname][status];
    });
  };


  SMC.insertHostName = function (opts) {
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

  SMC.getUpdatePromise = function () {
    SMC.saveTriggered = true;
    $rootScope.$broadcast('close-popovers');
    SMC.building = true;

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
        toRebuild = promiseArrayLength > 1 || SMC.openItems.getAllFileModels(true).length;

        toRedeploy = !toRebuild &&
          keypather.get(SMC, 'instance.attrs.env') !== keypather.get(SMC, 'state.opts.env');

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
        if (toRebuild) {
          return buildBuild(SMC.state);
        }
        return SMC.state;
      })
      .then(function (state) {
        if (toRebuild || toRedeploy) {
          return promisify(SMC.instance, 'update')(state.opts);
        }
      })
      .then(function () {
        if (toRedeploy) {
          return promisify(SMC.instance, 'redeploy')();
        }
      })
      .then(function () {
        helpCards.refreshActiveCard();
        close();
        $rootScope.$broadcast('alert', {
          type: 'success',
          text: 'Container updated successfully.'
        });
      })
      .catch(function (err) {
        errs.handler(err);
        resetState(SMC.state, true)
          .finally(function () {
            SMC.building = false;
          });
      });
  };

  function buildBuild(state) {
    eventTracking.triggeredBuild(false);
    return promisify(state.build, 'build')({ message: 'manual' })
      .then(function (build) {
        state.opts.build = build.id();
        return state;
      });
  }

  SMC.isDockerfileValid = function () {
    if (!SMC.state.advanced || !keypather.get(SMC, 'state.dockerfile.validation.criticals.length')) {
      return true;
    }
    return !SMC.state.dockerfile.validation.criticals.find(hasKeypaths({
      message: 'Missing or misplaced FROM'
    }));
  };

  resetState(SMC.instance);
}
