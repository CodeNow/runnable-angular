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
  watchWhenTruthyPromise,
  helpCards,
  $rootScope,
  $http,
  uploadFile,
  configAPIHost,
  cardInfoTypes
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

      $scope.fileRepository = {
        actions: {},
        data: {}
      };

      // TODO: create new ContainerFile object
      //  - expose ContainerFile
      $scope.server.containerFiles.forEach(function (file) {
        file.state = {
          view2: true,
          fromServer: true
        };
      });

      $scope.fileUpload = {
        actions: {
          file: {
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
            },
            save: function (containerFile) {
              // Push to parent container files
              $rootScope.$broadcast('close-popovers');
              var ContainerFile = cardInfoTypes()['Container File'];
              var myFile = new ContainerFile();
              myFile.name = containerFile.file[0].name;
              myFile.commands = containerFile.commands;
              myFile.path = containerFile.path;
              console.log(myFile);
              console.log(myFile.toString());
              $scope.server.containerFiles.push(myFile);

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
              if (containerFile.fileUpload) {
                $scope.server.containerFiles.splice($scope.server.containerFiles.indexOf(containerFile), 1);

                return $scope.data.fileUpload.then(function () {
                  var fileURL = configAPIHost + '/' + $scope.state.contextVersion.urlPath +
                    '/' + $scope.state.contextVersion.id() + '/files';
                  $http.delete(fileURL, {
                    withCredentials: true
                  })
                    .catch(errs.handler);
                });
              }
              if ($scope.data.name) {
                console.log($scope.data.name);
              }

            }
          },
          repo: {

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
        $scope.state = {
          advanced: server.advanced || false,
          startCommand: server.startCommand,
          commands: server.commands,
          selectedStack: server.selectedStack,
          opts: {
            env: keypather.get(server, 'opts.env')
          },
          repo: server.repo,
          server: server
        };

        if (server.repo) {
          $scope.branches = server.repo.branches;
          $scope.state.branch =
            server.repo.branches.models.find(hasKeypaths({'attrs.name': keypather.get(
              server,
              'instance.contextVersion.appCodeVersions.models[0].attrs.branch'
            )}));
        }
        return promisify(server.contextVersion, 'deepCopy')()
          .then(function (contextVersion) {
            $scope.state.contextVersion = contextVersion;
            return promisify(contextVersion, 'fetch')();
          })
          .then(function (contextVersion) {
            if (contextVersion.attrs.advanced) {
              openDockerfile();
            }
            if (contextVersion.appCodeVersions.models.length) {
              $scope.acv = contextVersion.appCodeVersions.models[0];
            }
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
            (!$scope.state.advanced && $scope.state.isStackInfoEmpty($scope.state.selectedStack))) {
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
        $scope.state.ports = convertTagToPortList();
        return watchWhenTruthyPromise($scope, 'state.contextVersion')
          .then(function () {
            var state = $scope.state;
            if (state.advanced) {
              return watchWhenTruthyPromise($scope, 'openItems.isClean()')
                .then(function () {
                  return buildBuild(state);
                });
            } else if (state.server.startCommand !== state.startCommand ||
                state.server.ports !== state.ports ||
                !angular.equals(state.server.selectedStack, state.selectedStack)) {
              return updateDockerfile(state);
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
            return buildBuild($scope.state);
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

      $scope.$watch('state.branch', function (newBranch, oldBranch) {
        if (newBranch && oldBranch && newBranch.attrs.name !== oldBranch.attrs.name) {
          waitForStateContextVersion($scope, function () {
            promisify($scope.acv, 'update')({
              repo: $scope.server.repo.attrs.full_name,
              branch: newBranch.attrs.name,
              commit: newBranch.attrs.commit.sha
            })
              .catch(errs.handler);
          });
        }
      });


      $scope.state.isStackInfoEmpty = function (selectedStack) {
        if (!selectedStack || !selectedStack.selectedVersion) {
          return true;
        }
        if (selectedStack.dependencies) {
          var depsEmpty = !selectedStack.dependencies.find(function (dep) {
            return !$scope.state.isStackInfoEmpty(dep);
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
