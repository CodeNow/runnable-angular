'use strict';

require('app')
  .directive('editServerModal', editServerModal);
/**
 * @ngInject
 */
function editServerModal(
  $q,
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
  loadingPromises
) {
  return {
    restrict: 'A',
    templateUrl: 'editServerModalView',
    scope: {
      actions: '=',
      data: '=',
      defaultActions: '=',
      server: '= currentModel',
      selectedTab: '= stateModel'
    },
    link: function ($scope, elem, attrs) {
      $scope.isLoading = $rootScope.isLoading;
      if (helpCards.cardIsActiveOnThisContainer($scope.server.instance)) {
        $scope.helpCards = helpCards;
        $scope.activeCard = helpCards.getActiveCard();
      }
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
        tags: new JSTagsCollection(($scope.server.ports || '').split(' '))
      };


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
        if (n) {
          $scope.linkedEnvResults = findLinkedServerVariables($scope.state.opts.env);
        }
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
      $scope.instance = $scope.server.instance;
      $scope.build = $scope.server.build;

      function resetState(server) {
        loadingPromises.clear('editServerModal');
        loading.reset('editServerModal');
        loading('editServerModal', true);
        $scope.state = {
          advanced: server.advanced || false,
          startCommand: server.startCommand,
          commands: server.commands,
          selectedStack: server.selectedStack,
          opts: {
            env: keypather.get(server, 'opts.env')
          },
          containerFiles: [],
          repo: server.repo,
          server: server
        };

        watchOncePromise($scope, 'server.containerFiles', true)
          .then(function (containerFiles) {
            $scope.state.containerFiles = containerFiles.map(function (model) {
              var cloned = model.clone();
              if (model.type === 'Main Repository') {
                $scope.state.mainRepoContainerFile = cloned;
              }
              return cloned;
            });
            $scope.data.mainRepo = $scope.server.containerFiles.find(hasKeypaths({
              type: 'Main Repository'
            }));
          });

        return promisify(server.contextVersion, 'deepCopy')()
          .then(function (contextVersion) {
            $scope.state.contextVersion = contextVersion;
            return promisify(contextVersion, 'fetch')();
          })
          .then(function (contextVersion) {
            if (contextVersion.attrs.advanced) {
              openDockerfile();
            }
            if (contextVersion.getMainAppCodeVersion()) {
              $scope.state.acv = contextVersion.getMainAppCodeVersion();
            }
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

      resetState($scope.server);

      $scope.changeTab = function (tabname) {
        if ($scope.editServerForm.$invalid ||
            (!$scope.state.advanced && $scope.isStackInfoEmpty($scope.state.selectedStack))) {
          return;
        }
        $scope.selectedTab = tabname;
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
        $scope.defaultActions.cancel();
      };

      $scope.getUpdatePromise = function () {
        $rootScope.$broadcast('close-popovers');
        $scope.building = true;
        var toRebuild = false;
        $scope.state.ports = convertTagToPortList();
        return loadingPromises.finished('editServerModal')
          .then(function (promiseArrayLength) {
            toRebuild = promiseArrayLength > 0;
          })
          .then(watchOncePromise($scope, 'state.contextVersion', true))
          .then(function () {
            var state = $scope.state;
            if (!state.advanced &&
                (state.server.startCommand !== state.startCommand ||
                state.server.ports !== state.ports ||
                !angular.equals(state.server.selectedStack, state.selectedStack))) {
              toRebuild = true;
              return updateDockerfile(state);
            }
            return state;
          })
          .then(function (state) {
            if (toRebuild) {
              return buildBuild(state);
            }
            return state;
          })
          .then(function (state) {
            return promisify($scope.instance, 'update')(state.opts);
          })
          .then(function () {
            helpCards.refreshActiveCard();
            $scope.defaultActions.close();
            if (keypather.get($scope.instance, 'container.running()')) {
              return promisify($scope.instance, 'redeploy')();
            }
          })
          .then(function () {
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
        if ($scope.state.mainRepoContainerFile) {
          $scope.state.mainRepoContainerFile.commands = $scope.state.commands;
        }
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
        var rootDir = keypather.get($scope.state, 'contextVersion.rootDir');
        if (!rootDir) {
          return $q.reject(new Error('rootDir not found'));
        }
        return promisify(rootDir.contents, 'fetch')()
          .then(function () {
            var file = rootDir.contents.models.find(function (file) {
              return (file.attrs.name === 'Dockerfile');
            });
            if (file) {
              $scope.openItems.add(file);
            }
          });
      }

      // Only start watching this after the context version has
      $scope.$watch('state.advanced', function (advanced, previousAdvanced) {
        // This is so we don't fire the first time with no changes
        if (advanced !== previousAdvanced) {
          waitForStateContextVersion($scope, function () {
            $rootScope.$broadcast('close-popovers');
            $scope.selectedTab = advanced ? 'buildfiles' : 'stack';
            if (advanced) {
              openDockerfile();
            }
            return promisify($scope.state.contextVersion, 'update')({
              advanced: advanced
            })
              .catch(function (err) {
                errs.handler(err);
                $scope.state.advanced = $scope.server.advanced;
              });
          });
        }
      });

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

function waitForStateContextVersion($scope, cb) {
  var unWatch = $scope.$watch('state.contextVersion', function (n) {
    if (n) {
      unWatch();
      cb();
    }
  });
}
