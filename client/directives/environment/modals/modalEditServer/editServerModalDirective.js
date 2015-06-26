'use strict';

require('app')
  .directive('editServerModal', editServerModal);

// something can't be both basic and advanced, they are if/else
var tabVisibility = {
  buildfiles: { advanced: true, nonRepo: true, basic: false },
  stack:  { advanced: false, nonRepo: false, basic: true },
  ports:  { advanced: false, nonRepo: false, basic: true },
  env:  { advanced: true, nonRepo: true, basic: true },
  repository:  { advanced: false, nonRepo: false, basic: true },
  files:  { advanced: false, nonRepo: false, basic: true },
  translation:  { advanced: true, nonRepo: false, basic: true },
  logs:  { advanced: true, nonRepo: true, basic: true }
};
/**
 * @ngInject
 */
function editServerModal(
  $filter,
  errs,
  JSTagsCollection,
  hasKeypaths,
  eventTracking,
  fetchDockerfileFromSource,
  findLinkedServerVariables,
  keypather,
  OpenItems,
  fetchUser,
  populateDockerfile,
  promisify,
  watchOncePromise,
  helpCards,
  $rootScope,
  uploadFile,
  configAPIHost,
  cardInfoTypes,
  $timeout,
  loading,
  loadingPromises,
  fetchStackInfo,
  fetchSourceContexts,
  fetchInstancesByPod,
  parseDockerfileForCardInfoFromInstance
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

      loading.reset('editServerModal');
      loading('editServerModal', true);

      fetchInstancesByPod()
        .then(function (instances) {
          $scope.instances = instances;
        });

      // temp fix
      $scope.data = {};

      fetchStackInfo()
        .then(function (stackInfo) {
          $scope.data.stacks = stackInfo;
        });
      fetchSourceContexts()
        .then(function (contexts) {
          $scope.data.sourceContexts = contexts;
        });
      parseDockerfileForCardInfoFromInstance($scope.instance)
        .then(function (data) {
          Object.keys(data).forEach(function (key) {
            $scope.instance[key] = data[key];
          });
          resetState($scope.instance);
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
            tags: new JSTagsCollection(($scope.instance.ports || '').split(' '))
          };
        });

      if (helpCards.cardIsActiveOnThisContainer($scope.instance)) {
        $scope.helpCards = helpCards;
        $scope.activeCard = helpCards.getActiveCard();
      }


      $scope.triggerEditRepo = function (repo) {
        if (repo.type === 'Main Repository') { return; }
        $scope.repositoryPopover.data = {
          repo: repo.clone(),
          appCodeVersions: $scope.state.contextVersion.appCodeVersions.models
        };
        $scope.repositoryPopover.active = true;
      };

      $scope.triggerAddRepository = function () {
        $scope.repositoryPopover.data = {
          appCodeVersions: $scope.state.contextVersion.appCodeVersions.models
        };
        $scope.repositoryPopover.active = true;
      };

      $scope.triggerUploadFile = function () {
        $scope.fileUpload.data = {};
        $scope.fileUpload.active = true;
        $timeout(function () {
          $scope.fileUpload.active = false;
        });
      };

      $scope.dropContainerFile = function (event, newIndex, containerFileId) {
        var currentIndex = 0;
        var containerFile = $scope.state.containerFiles.find(function (containerFile, index) {
          currentIndex = index;
          return containerFile.id === containerFileId;
        });
        $scope.state.containerFiles.splice(currentIndex, 1);
        $scope.state.containerFiles.splice(newIndex, 0, containerFile);
      };

      $scope.repositoryPopover = {
        actions: {
          remove: function (repo) {
            var myIndex = 0;
            $scope.state.containerFiles.find(function (containerFile, index) {
              myIndex = index;
              return containerFile.id === repo.id;
            });

            $scope.state.containerFiles.splice(myIndex, 1);

            var acv = $scope.state.contextVersion.appCodeVersions.models.find(function (acv) {
              return acv.attrs.repo.split('/')[1] === repo.repo.attrs.name;
            });

            loadingPromises.add('editServerModal', promisify(acv, 'destroy')())
              .catch(errs.handler);
          },
          create: function (repo) {
            $scope.state.containerFiles.push(repo);
            loadingPromises.add('editServerModal', promisify($scope.state.contextVersion.appCodeVersions, 'create', true)({
              repo: repo.repo.attrs.full_name,
              branch: repo.branch.attrs.name,
              commit: repo.commit.attrs.sha,
              additionalRepo: true
            }))
              .then(function (acv) {
                repo.acv = acv;
              })
              .catch(errs.handler);
          },
          update: function (repo) {
            var myRepo = $scope.state.containerFiles.find(function (containerFile) {
              return containerFile.id === repo.id;
            });

            Object.keys(repo).forEach(function (key) {
              myRepo[key] = repo[key];
            });

            var acv = $scope.state.contextVersion.appCodeVersions.models.find(function (acv) {
              return acv.attrs.repo === repo.acv.attrs.repo;
            });

            loadingPromises.add('editServerModal', promisify(acv, 'update')({
              branch: repo.branch.attrs.name,
              commit: repo.commit.attrs.sha
            })
              .then(function (acv) {
                myRepo.acv = acv;
              })
              .catch(errs.handler)
            );
          }
        },
        data: {},
        active: false
      };

      $scope.fileUpload = {
        actions: {
          uploadFile: function (containerFile) {
            if (!containerFile.file.length) { return; }
            containerFile.saving = true;

            var uploadURL = configAPIHost + '/' + $scope.state.contextVersion.urlPath +
                '/' + $scope.state.contextVersion.id() + '/files';
            var files = containerFile.file;
            containerFile.name = files[0].name;

            containerFile.fileUpload = uploadFile(files, uploadURL)
              .progress(function (evt) {
                containerFile.progress = parseInt(100.0 * evt.loaded / evt.total, 10);
              })
              .then(function (fileResponse) {
                containerFile.name = fileResponse.data.name;
              })
              .catch(errs.handler)
              .finally(function () {
                containerFile.saving = false;
              });

            loadingPromises.add('editServerModal', containerFile.fileUpload);
          },
          save: function (containerFile) {
            if (!containerFile.type) {
              var ContainerFile = cardInfoTypes.File;
              var myFile = new ContainerFile();
              if (containerFile.file) {
                myFile.name = containerFile.file[0].name;
              }
              myFile.commands = containerFile.commands;
              myFile.path = containerFile.path;
              $scope.state.containerFiles.push(myFile);
            }
            $rootScope.$broadcast('close-popovers');

          },
          cancel: function (containerFile) {
            // Using our own cancel in order to delete file
            $rootScope.$broadcast('close-popovers');
            if (containerFile.fileUpload) {
              $scope.fileUpload.actions.file.deleteFile();
            }
          },
          deleteFile: function (containerFile) {
            $rootScope.$broadcast('close-popovers');

            var file = $scope.state.contextVersion.rootDir.contents.models.find(function (fileModel) {
              return fileModel.attrs.name === containerFile.name;
            });
            if (file) {
              loadingPromises.add('editServerModal',
                promisify(file, 'destroy')()
                  .catch(errs.handler)
              );
            }

            $scope.state.containerFiles.splice($scope.state.containerFiles.indexOf(containerFile), 1);
          }
        },
        data: {}
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

      function resetState(instance) {

        loadingPromises.clear('editServerModal');
        loading.reset('editServerModal');
        loading('editServerModal', true);
        $scope.state = {
          advanced: keypather.get(instance, 'contextVersion.attrs.advanced') || false,
          startCommand: instance.startCommand,
          commands: instance.commands,
          selectedStack: instance.selectedStack,
          opts: {
            env: keypather.get(instance, 'attrs.env') || []
          },
          containerFiles: [],
          repo: keypather.get(instance, 'contextVersion.getMainAppCodeVersion().githubRepo'),
          instance: instance
        };

        watchOncePromise($scope, 'instance.containerFiles', true)
          .then(function (containerFiles) {
            $scope.state.containerFiles = containerFiles.map(function (model) {
              var cloned = model.clone();
              if (model.type === 'Main Repository') {
                $scope.state.mainRepoContainerFile = cloned;
              }
              return cloned;
            });
            $scope.data.mainRepo = $scope.instance.containerFiles.find(hasKeypaths({
              type: 'Main Repository'
            }));
          });

        return loadingPromises.add('editServerModal', promisify(instance.contextVersion, 'deepCopy')())
          .then(function (contextVersion) {
            $scope.state.contextVersion = contextVersion;
            return promisify(contextVersion, 'fetch')();
          })
          .then(function (contextVersion) {
            if (contextVersion.attrs.advanced) {
              openDockerfile();
            }
            $scope.state.acv = contextVersion.getMainAppCodeVersion();
            loading('editServerModal', false);
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
      }

      $scope.changeTab = function (tabname) {
        if (!$scope.state.advanced) {
          if ($filter('selectedStackInvalid')($scope.state.selectedStack)) {
            tabname = 'stack';
          } else if (!$scope.state.startCommand) {
            tabname = 'repository';
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
          return new Error('This tab shouldn\'t exist');
        }
        var currentStatuses = [];
        var currentContextVersion = keypather.get($scope, 'instance.contextVersion');
        var stateAdvanced = keypather.get($scope, 'state.advanced');

        if (!currentContextVersion.getMainAppCodeVersion()) {
          currentStatuses.push('nonRepo');
        }
        if (stateAdvanced ||
            (!keypather.get($scope, 'state.contextVerison.attrs.advanced') && keypather.get(currentContextVersion, 'attrs.advanced'))) {
          currentStatuses.push('advanced');
        } else {
          currentStatuses.push('basic');
        }
        return currentStatuses.every(function (status) {
          return tabVisibility[tabname][status];
        });
      };


      $scope.insertHostName = function (opts) {
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

      $scope.cancel = function () {
        helpCards.setActiveCard(null);
        $scope.modalActions.cancel();
      };
      function areContainerFilesDifferent() {
        var serverListLength = keypather.get($scope, 'instance.containerFiles.length') || 0;
        var stateListLength = keypather.get($scope, 'state.containerFiles.length') || 0;

        if (serverListLength !== stateListLength) {
          return true;
        }
        return $scope.state.containerFiles.some(function (stateFile, index) {
          var serverFile = $scope.instance.containerFiles[index];
          return stateFile.commands !== serverFile.commands ||
                stateFile.path !== serverFile.path ||
                stateFile.name !== serverFile.name ||
                stateFile.type !== serverFile.type;
        });
      }

      function shouldFnrCreateDockerfile() {
        var serverFnRObject = keypather.get($scope, 'instance.contextVersion.getMainAppCodeVersion().transformRules');
        var serverFnRCount = serverFnRObject ?
            serverFnRObject.exclude.length + serverFnRObject.rename.length + serverFnRObject.replace.length : 0;
        var stateFnRObject = keypather.get($scope, 'state.contextVersion.getMainAppCodeVersion().transformRules');
        var stateFnRCount = stateFnRObject ?
            stateFnRObject.exclude.length + stateFnRObject.rename.length + stateFnRObject.replace.length : 0;
        // This should be true if the one of the counts is greater than zero, but the other is zero
        return (serverFnRCount || stateFnRCount) && (serverFnRCount === 0 || stateFnRCount === 0);
      }

      $scope.getUpdatePromise = function () {
        $rootScope.$broadcast('close-popovers');
        $scope.building = true;
        $scope.state.ports = convertTagToPortList();
        if ($scope.state.mainRepoContainerFile) {
          $scope.state.mainRepoContainerFile.commands = $scope.state.commands;
        }
        var hasMainRepo = !!keypather.get($scope, 'instance.contextVersion.getMainAppCodeVersion()');
        var statePorts = keypather.get($scope, 'state.ports.join(" ")');
        // Check state.instance instead of instance so you don't recreate the dockerfile again on a
        // failure (and they didn't change it in between)
        // true if not advanced, has a repo, and one of the following:
        var toRecreateDockerfile = !$scope.state.advanced &&
              hasMainRepo &&
              (
                // The container files have been changed
                areContainerFilesDifferent() ||
                // FnR has changed
                shouldFnrCreateDockerfile() ||
                // The ports have changed
                !angular.equals($scope.state.instance.ports, statePorts) ||
                // We have a new start command
                $scope.state.instance.startCommand !== $scope.state.startCommand ||
                // Completely new stack
                !angular.equals($scope.state.instance.selectedStack, $scope.state.selectedStack)
              );

        var toRebuild = toRecreateDockerfile;
        var toRedeploy = !toRecreateDockerfile &&
              keypather.get($scope, 'instance.attrs.env') !== keypather.get($scope, 'state.opts.env');

        // So we should do this watchPromise step first so that any tab that relies on losing focus
        // to change something will have enough time to add its promises to LoadingPromises
        return watchOncePromise($scope, 'state.contextVersion', true)
          .then(function () {
            return loadingPromises.finished('editServerModal');
          })
          .then(function (promiseArrayLength) {
            // Since the initial deepCopy should be in here, we only care about > 1
            toRebuild = toRebuild || promiseArrayLength > 1;
            toRedeploy = toRedeploy && !toRebuild;
            return $scope.state;

          })
          .then(function (state) {
            if (toRecreateDockerfile) {
              return updateDockerfile(state);
            }
            return state;
          })
          .then(function (state) {
            if (toRecreateDockerfile || toRebuild) {
              return buildBuild(state);
            }
            return state;
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
            resetState($scope.state)
              .then(function () {
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

      function updateDockerfile(state) {
        return promisify(state.contextVersion, 'fetchFile')('/Dockerfile')
          .then(function (newDockerfile) {
            state.dockerfile = newDockerfile;
            return fetchDockerfileFromSource(
              state.selectedStack.key,
              $scope.data.sourceContexts
            );
          })
          .then(function (sourceDockerfile) {
            return populateDockerfile(
              sourceDockerfile,
              state,
              state.dockerfile
            );
          })
          .then(function () {
            return state;
          });
      }

      function openDockerfile() {
        return promisify($scope.state.contextVersion, 'fetchFile')('/Dockerfile')
          .then(function (dockerfile) {
            if (dockerfile) {
              $scope.openItems.add(dockerfile);
            }
            $scope.state.dockerfile = dockerfile;
          });
      }

      // Only start watching this after the context version has
      $scope.$watch('state.advanced', function (advanced, previousAdvanced) {
        // This is so we don't fire the first time with no changes
        if (previousAdvanced === Boolean(previousAdvanced) && advanced !== previousAdvanced) {
          watchOncePromise($scope, 'state.contextVersion', true)
            .then(function () {
              $rootScope.$broadcast('close-popovers');
              $scope.selectedTab = advanced ? 'buildfiles' : 'stack';
              if (advanced) {
                openDockerfile();
              }
              return loadingPromises.add('editServerModal', promisify($scope.state.contextVersion, 'update')({
                advanced: advanced
              }));
            })
            .catch(function (err) {
              errs.handler(err);
              $scope.state.advanced = keypather.get($scope.instance, 'contextVersion.attrs.advanced');
            });
        }
      });
      $scope.isDockerfileValid = function () {
        if (!$scope.state.advanced || !keypather.get($scope, 'state.dockerfile.validation.criticals.length')) {
          return true;
        }
        return !$scope.state.dockerfile.validation.criticals.find(hasKeypaths({
          message: 'Missing or misplaced FROM'
        }));
      };


      $scope.isStackInfoEmpty = function (selectedStack) {
        if (!selectedStack || !selectedStack.selectedVersion) {
          return true;
        }
        if (selectedStack.dependencies) {
          var depsEmpty = !selectedStack.dependencies.find(function (dep) {
            return !$scope.isStackInfoEmpty(dep);
          });
          return !!depsEmpty;
        }
      };
    }
  };
}
