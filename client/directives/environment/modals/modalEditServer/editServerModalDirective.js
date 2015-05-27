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
  uploadFile,
  configAPIHost,
  cardInfoTypes,
  $timeout,
  fetchOwnerRepos
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


      $scope.triggerEditRepo = function (repo) {
        if (repo.type === 'Main Repository') { return; }
        $scope.repositoryPopover.data.repoObj = repo;
        $scope.repositoryPopover.data.fromServer = true;
        $scope.repositoryPopover.data.repo = repo.repo;
        $scope.repositoryPopover.data.branch = repo.branch;
        $scope.repositoryPopover.data.commit = repo.commit;
        $scope.repositoryPopover.data.commands = repo.commands;
        $scope.repositoryPopover.data.path = repo.path;
        $scope.repositoryPopover.data.name = repo.name;
        $scope.repositoryPopover.data.state.view = 2;
        $scope.repositoryPopover.active = true;

        $timeout(function () {
          $scope.repositoryPopover.active = false;
        });
      };

      $scope.triggerAddRepository = function () {
        $scope.repositoryPopover.data = {
          fromServer: false,
          containerFiles: $scope.state.containerFiles,
          state: {
            view: 1
          }
        };
        $scope.repositoryPopover.active = true;

        fetchOwnerRepos($rootScope.dataApp.data.activeAccount.oauthName())
          .then(function (repoList) {
            $scope.repositoryPopover.data.githubRepos = repoList;
          })
          .catch(errs.handler);

        $timeout(function () {
          $scope.repositoryPopover.active = false;
        });
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
          remove: function () {
            var repo = $scope.repositoryPopover.data.repo;

            var acv = $scope.state.contextVersion.appCodeVersions.models.find(function (acv) {
              return acv.attrs.repo.split('/')[1] === repo.attrs.name;
            });

            promisify(acv, 'destroy')()
              .catch(errs.handler);

            $scope.state.containerFiles.splice($scope.state.containerFiles.indexOf(repo), 1);

            $rootScope.$broadcast('close-popovers');
          },
          selectRepo: function (repo) {
            $scope.repositoryPopover.data.repo = repo;
            $scope.repositoryPopover.data.loading = true;
            $scope.repositoryPopover.data.repo.loading = true;

            promisify(repo.branches, 'fetch')()
              .then(function (branches) {
                return branches.models.find(hasKeypaths({'attrs.name': repo.attrs.default_branch}));
              })
              .then(function (branch) {
                $scope.repositoryPopover.data.branch = branch;
                return promisify(branch.commits, 'fetch')();
              })
              .then(function (commits) {
                $scope.repositoryPopover.data.loading = false;
                $scope.repositoryPopover.data.repo.loading = false;
                $scope.repositoryPopover.data.state.view = 2;
                $scope.repositoryPopover.data.commit = commits.models[0];
              })
              .catch(errs.handler);
          },
          toggleSelectLatestCommit: function () {
            if ($scope.repositoryPopover.data.latestCommit) {
              $scope.repositoryPopover.data.commit = $scope.repositoryPopover.data.branch.commits.models[0];
              $scope.repositoryPopover.data.state.view = 2;
            }
          },
          selectBranch: function (branch) {
            $scope.repositoryPopover.data.latestCommit = false;
            $scope.repositoryPopover.data.branch = branch;
            promisify(branch.commits, 'fetch')()
              .catch(errs.handler);
          },
          selectCommit: function (commit){
            $scope.repositoryPopover.data.latestCommit = false;
            $scope.repositoryPopover.data.commit = commit;
            $scope.repositoryPopover.data.state.view = 2;
          },
          save: function () {
            var myRepo;
            if ($scope.repositoryPopover.data.fromServer) {
              myRepo = $scope.repositoryPopover.data.repoObj;
              $scope.repositoryPopover.data.repoObj = null;

              var acv = $scope.state.contextVersion.appCodeVersions.models.find(function (acv) {
                return acv.attrs.repo === myRepo.acv.attrs.repo;
              });

              promisify(acv, 'update')({
                branch: $scope.repositoryPopover.data.branch.attrs.name,
                commit: $scope.repositoryPopover.data.commit.attrs.sha
              })
                .then(function (acv) {
                  myRepo.acv = acv;
                })
                .catch(errs.handler);

            } else {
              var Repo = cardInfoTypes().Repository;
              myRepo = new Repo();
              $scope.state.containerFiles.push(myRepo);

              promisify($scope.state.contextVersion.appCodeVersions, 'create', true)({
                repo: $scope.repositoryPopover.data.repo.attrs.full_name,
                branch: $scope.repositoryPopover.data.branch.attrs.name,
                commit: $scope.repositoryPopover.data.commit.attrs.sha,
                additionalRepo: true
              })
                .then(function (acv) {
                  myRepo.acv = acv;
                })
                .catch(errs.handler);
            }

            myRepo.name = $scope.repositoryPopover.data.repo.attrs.name;
            myRepo.repo = $scope.repositoryPopover.data.repo;
            myRepo.branch = $scope.repositoryPopover.data.branch;
            myRepo.commit = $scope.repositoryPopover.data.commit;
            myRepo.commands = $scope.repositoryPopover.data.commands;
            myRepo.path = $scope.repositoryPopover.data.path;

            $rootScope.$broadcast('close-popovers');
          }
        },
        data: {
          state: {
            view: 2
          }
        },
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
          },
          save: function (containerFile) {
            if (!containerFile.type) {
              var ContainerFile = cardInfoTypes().File;
              var myFile = new ContainerFile();
              if (containerFile.file) {
                myFile.name = containerFile.file[0].name;
              }
              myFile.commands = containerFile.commands;
              myFile.path = containerFile.path;
              $scope.state.containerFiles.push(myFile);
            }
            // Push to parent container files
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
              promisify(file, 'destroy')()
                .catch(errs.handler);
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

        watchWhenTruthyPromise($scope, 'server.containerFiles')
          .then(function (containerFiles) {
            $scope.state.containerFiles = containerFiles.map(function (model) {
              var cloned = model.clone();
              if (model.type === 'Main Repository') {
                $scope.state.mainRepoContainerFile = cloned;
              }
              return cloned;
            });
            $scope.data.mainRepo = $scope.server.containerFiles.find(hasKeypaths({
              type: 'Main Repo'
            }));
          });

        if (server.repo) {
          $scope.branches = server.repo.branches;
          $scope.state.branch =
            server.repo.branches.models.find(hasKeypaths({'attrs.name': keypather.get(
              server,
              'instance.contextVersion.getMainAppCodeVersion().attrs.branch'
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
            if (contextVersion.getMainAppCodeVersion()) {
              $scope.state.acv = contextVersion.getMainAppCodeVersion();
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
        $rootScope.$broadcast('eventPasteLinkedInstance', 'VAR=' + hostName);
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
            promisify($scope.state.acv, 'update')({
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
