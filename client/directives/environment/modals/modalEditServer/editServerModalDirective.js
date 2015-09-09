'use strict';

require('app')
  .directive('editServerModal', editServerModal);

// something can't be both basic and advanced, they are if/else
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
function editServerModal(
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
  JSTagsCollection,
  keypather,
  loading,
  loadingPromises,
  OpenItems,
  parseDockerfileForCardInfoFromInstance,
  promisify,
  updateDockerfileFromState,
  $timeout
) {
  return {
    restrict: 'A',
    templateUrl: 'editServerModalView',
    scope: {
      modalActions: '= modalActions',
      selectedTab: '= selectedTab',
      instance: '= instance'
    },
    link: function ($scope, elem, attrs) {
      $scope.isLoading = $rootScope.isLoading;

      $scope.showDebugCmd = false;
      $scope.$on('debug-cmd-status', function (evt, status) {
        $scope.showDebugCmd = status;
      });

      $scope.startCommand = function () {
        var cmd = keypather.get($scope, 'instance.containers.models[0].attrs.inspect.Config.Cmd[2]');
        cmd = cmd || '';
        return cmd.replace('until grep -q ethwe /proc/net/dev; do sleep 1; done;', '');
      };

      loading.reset('editServerModal');
      loading('editServerModal', true);

      // temp fix
      $scope.data = {};
      $scope.portTagOptions = {
        breakCodes: [
          13, // return
          32, // space
          44, // comma (opera)
          188 // comma (mozilla)
        ],
        texts: {
          'inputPlaceHolder': 'Add ports here',
          maxInputLength: 5,
          onlyDigits: true
        },
        minTagWidth: 120,
        tags: new JSTagsCollection([])
      };
      $scope.state = {
        opts: {
          env: keypather.get($scope.instance, 'attrs.env')
        },
        getPorts: convertTagToPortList,
        instance: $scope.instance,
        promises: {}
      };

      fetchInstancesByPod()
        .then(function (instances) {
          $scope.data.instances = instances;
        });

      fetchStackInfo()
        .then(function (stackInfo) {
          $scope.data.stacks = stackInfo;
        });
      fetchSourceContexts()
        .then(function (contexts) {
          $scope.data.sourceContexts = contexts;
        });

      if (helpCards.cardIsActiveOnThisContainer($scope.instance)) {
        $scope.helpCards = helpCards;
        $scope.activeCard = helpCards.getActiveCard();
      }
      $scope.updateDockerfileFromState = function () {
        return loadingPromises.add('editServerModal', updateDockerfileFromState($scope.state));
      };
      $scope.$watch('state.opts.env.join()', function (n) {
        if (!n) { return; }
        $scope.linkedEnvResults = findLinkedServerVariables($scope.state.opts.env);
      });

      $scope.openItems = new OpenItems();

      function convertTagToPortList() {
        return Object.keys($scope.portTagOptions.tags.tags).map(function (key) {
          return $scope.portTagOptions.tags.tags[key].value;
        });
      }
      $scope.validation = {
        env: null
      };

      // For the build and server logs
      $scope.build = $scope.instance.build;

      function afterParsingDockerfile(data, contextVersion) {
        Object.keys(data).forEach(function (key) {
          $scope.instance[key] = data[key];
        });
        $scope.state.ports = data.ports;
        $scope.portTagOptions.tags = new JSTagsCollection((data.ports || '').split(' '));
        $scope.portTagOptions.tags.onAdd(function (newTag) {
          var tags = $scope.portTagOptions.tags;
          /*!
           * Check for non-allowed chars and ports
           */
          // Remove ports over the max
            if ((newTag.value.match(/[^0-9]/g) !== null) || (parseInt(newTag.value, 10) > 65535)) {
                tags.removeTag(newTag.id);
                errs.handler(new Error('Port is invalid (Above 65,535)'));
            }
          /*!
           * Check for duplicate ports
           */
          // Check that there are no duplicates
          Object.keys(tags.tags).forEach(function (key) {
            var tag = tags.tags[key];
            if (tag && tag.value === newTag.value && tag.id !== newTag.id) {
              // Remove duplicate tag. Perhaps, have a pop-up?
              errs.handler(new Error('No duplicate ports allowed.'));
              tags.removeTag(newTag.id);
            }
          });
        });
        $scope.portTagOptions.tags.onAdd($scope.updateDockerfileFromState);
        $scope.portTagOptions.tags.onRemove($scope.updateDockerfileFromState);

        $scope.state.packages = data.packages;
        $scope.state.startCommand = data.startCommand;
        $scope.state.selectedStack = data.selectedStack;

        function mapContainerFiles(model) {
          var cloned = model.clone();
          if (model.type === 'Main Repository') {
            $scope.state.mainRepoContainerFile = cloned;
          }
          return cloned;
        }

        if (data.containerFiles) {
          $scope.state.containerFiles = data.containerFiles.map(mapContainerFiles);
        }
      }

      $scope.resetStateContextVersion = function (contextVersion, showSpinner) {
        loading.reset('editServerModal');
        if (showSpinner) {
          loading('editServerModal', true);
        }
        $scope.state.advanced = keypather.get(contextVersion, 'attrs.advanced') || false;
        $scope.state.promises.contextVersion = loadingPromises.add(
          'editServerModal',
          promisify(contextVersion, 'deepCopy')()
            .then(function (contextVersion) {
              $scope.state.contextVersion = contextVersion;
              $scope.state.acv = contextVersion.getMainAppCodeVersion();
              $scope.state.repo = keypather.get(contextVersion, 'getMainAppCodeVersion().githubRepo');
              return promisify(contextVersion, 'fetch')();
            })
        );
        // We only set showSpinner to true when an error has not occurred, so we should only
        // parse dockerfile info when this is true
        if (showSpinner) {
          $scope.state.promises.contextVersion
            .then(function (contextVersion) {
              return parseDockerfileForCardInfoFromInstance($scope.instance, contextVersion)
                .then(function (data) {
                  return afterParsingDockerfile(data, contextVersion);
                });
            })
            .then(function () {
              loading('editServerModal', false);
            });
        }

        return $scope.state.promises.contextVersion
          .then(function () {
            return openDockerfile();
          })
          .then(function () {
            return fetchUser();
          })
          .then(function (user) {
            return promisify(user, 'createBuild')({
              contextVersions: [$scope.state.contextVersion.id()],
              owner: {
                github: $rootScope.dataApp.data.activeAccount.oauthId()
              }
            });
          })
          .then(function (build) {
            $scope.state.build = build;
          })
          .catch(function (err) {
            errs.handler(err);
          });
      };

      $scope.$on('resetStateContextVersion', function ($event, contextVersion, showSpinner) {
        $event.stopPropagation();
        $scope.resetStateContextVersion(contextVersion, showSpinner);
      });

      function resetState(instance, fromError) {
        loadingPromises.clear('editServerModal');

        return $scope.resetStateContextVersion(instance.contextVersion, !fromError);
      }

      $scope.changeTab = function (tabname) {
        if (!$scope.state.advanced) {
          if ($filter('selectedStackInvalid')($scope.state.selectedStack)) {
            tabname = 'repository';
          } else if (!$scope.state.startCommand) {
            tabname = 'commands';
          }
        } else if ($scope.editServerForm.$invalid) {
          if (keypather.get($scope, 'editServerForm.$error.required.length')) {
            var firstRequiredError = $scope.editServerForm.$error.required[0].$name;
            tabname = firstRequiredError.split('.')[0];
          }
        }
        $scope.selectedTab = tabname;
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
      $scope.isTabVisible = function (tabname) {
        if (!tabVisibility[tabname]) {
          return false;
        }
        var currentStatuses = [];
        var currentContextVersion = keypather.get($scope, 'instance.contextVersion');
        var stateAdvanced = keypather.get($scope, 'state.advanced');

        if (!currentContextVersion.getMainAppCodeVersion()) {
          currentStatuses.push('nonRepo');
        }
        if (stateAdvanced ||
            (!keypather.get($scope, 'state.contextVersion') && keypather.get(currentContextVersion, 'attrs.advanced'))) {
          currentStatuses.push('advanced');
        } else {
          currentStatuses.push('basic');
        }
        return currentStatuses.every(function (status) {
          return tabVisibility[tabname][status];
        });
      };


      $scope.insertHostName = function (opts) {
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

      $scope.getUpdatePromise = function () {
        $rootScope.$broadcast('close-popovers');
        $scope.building = true;
        $scope.state.ports = convertTagToPortList();

        var toRebuild;
        var toRedeploy;
        // So we should do this watchPromise step first so that any tab that relies on losing focus
        // to change something will have enough time to add its promises to LoadingPromises
        return $scope.state.promises.contextVersion
          .then(function () {
            return loadingPromises.finished('editServerModal');
          })
          .then(function (promiseArrayLength) {
            // Since the initial deepCopy should be in here, we only care about > 1
            toRebuild = promiseArrayLength > 1 || $scope.openItems.getAllFileModels(true).length || keypather.get($scope, 'instance.attrs.build.failed');
            toRedeploy = !toRebuild &&
              keypather.get($scope, 'instance.attrs.env') !== keypather.get($scope, 'state.opts.env');
            if (!$scope.openItems.isClean()) {
              return $scope.openItems.updateAllFiles();
            }
          })
          .then(function () {
            if (toRebuild) {
              return buildBuild($scope.state);
            }
            return $scope.state;
          })
          .then(function (state) {
            if (toRebuild || toRedeploy) {
              return promisify($scope.instance, 'update')(state.opts);
            }
          })
          .then(function () {
            if (toRedeploy) {
              return promisify($scope.instance, 'redeploy')();
            }
          })
          .then(function () {
            helpCards.refreshActiveCard();
            $scope.modalActions.close();
            $rootScope.$broadcast('alert', {
              type: 'success',
              text: 'Container updated successfully.'
            });
          })
          .catch(function (err) {
            errs.handler(err);
            resetState($scope.state, true)
              .finally(function () {
                $scope.building = false;
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

      function openDockerfile() {
        return promisify($scope.state.contextVersion, 'fetchFile')('/Dockerfile')
          .then(function (dockerfile) {
            if ($scope.state.dockerfile) {
              $scope.openItems.remove($scope.state.dockerfile);
            }
            if (dockerfile) {
              $scope.openItems.add(dockerfile);
            }
            $scope.state.dockerfile = dockerfile;
          });
      }

      resetState($scope.instance);


      $scope.isDockerfileValid = function () {
        if (!$scope.state.advanced || !keypather.get($scope, 'state.dockerfile.validation.criticals.length')) {
          return true;
        }
        return !$scope.state.dockerfile.validation.criticals.find(hasKeypaths({
          message: 'Missing or misplaced FROM'
        }));
      };

      function isDirty () {
        return loadingPromises.count('editServerModal') > 1 || keypather.get($scope, 'instance.attrs.env') !== keypather.get($scope, 'state.opts.env') || !$scope.openItems.isClean();
      }

      var closeActions  = {};
      function triggerClose () {
        return $q(function (resolve, reject) {
          if (!isDirty()) {
            resolve();
            return;
          }

          closeActions.resolve = resolve;
          closeActions.reject = reject;
          $scope.confirmClose.active = true;
          $timeout(function () {
            $scope.confirmClose.active = false;
          });
        })
          .then(function () {
            helpCards.setActiveCard(null);
          });
      }

      $rootScope.$emit('set-close-modal-handler', triggerClose);

      $scope.$on('$destroy', function () {
        $rootScope.$emit('reset-close-modal-handler');
      });

      $scope.confirmClose = {
        active: false,
        actions: {
          cancel: function () {
            $rootScope.$broadcast('close-popovers');
            closeActions.reject();
          },
          confirm: function () {
            $rootScope.$broadcast('close-popovers');
            closeActions.resolve();
          }
        }
      };
    }
  };
}
