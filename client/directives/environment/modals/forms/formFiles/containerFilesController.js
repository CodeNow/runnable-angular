'use strict';

require('app').controller('ContainerFilesController', ContainerFilesController);

function ContainerFilesController(
  $scope,
  loadingPromises,
  promisify,
  errs,
  $rootScope,
  uploadFile,
  configAPIHost,
  cardInfoTypes,
  hasKeypaths,
  $timeout,
  updateDockerfileFromState,
  $q,
  keypather
) {

  var self = this;
  this.repositoryPopover = {
    actions: {
      remove: function (repoContainerFile) {
        var myIndex = 0;
        $scope.state.containerFiles.find(function (containerFile, index) {
          myIndex = index;
          return containerFile.id === repoContainerFile.id;
        });

        $scope.state.containerFiles.splice(myIndex, 1);

        var acv = $scope.state.contextVersion.appCodeVersions.models.find(function (acv) {
          return acv.attrs.repo.split('/')[1] === repoContainerFile.repo.attrs.name;
        });

        loadingPromises.add('editServerModal', promisify(acv, 'destroy')()
          .then(function () {
            return updateDockerfileFromState($scope.state);
          })
        )
          .catch(errs.handler);
      },
      create: function (repoContainerFile) {
        $scope.state.containerFiles.push(repoContainerFile);
        loadingPromises.add('editServerModal', promisify($scope.state.contextVersion.appCodeVersions, 'create', true)({
            repo: repoContainerFile.repo.attrs.full_name,
            branch: repoContainerFile.branch.attrs.name,
            commit: repoContainerFile.commit.attrs.sha,
            additionalRepo: true
          })
          .then(function (acv) {
            repoContainerFile.acv = acv;
            return updateDockerfileFromState($scope.state);
          })
        )
          .catch(errs.handler);
      },
      update: function (repoContainerFile) {
        var myRepo = $scope.state.containerFiles.find(function (containerFile) {
          return containerFile.id === repoContainerFile.id;
        });

        Object.keys(repoContainerFile).forEach(function (key) {
          myRepo[key] = repoContainerFile[key];
        });

        var acv = $scope.state.contextVersion.appCodeVersions.models.find(function (acv) {
          return acv.attrs.repo === repoContainerFile.acv.attrs.repo;
        });

        loadingPromises.add('editServerModal', promisify(acv, 'update')({
            branch: repoContainerFile.branch.attrs.name,
            commit: repoContainerFile.commit.attrs.sha
          })
          .then(function (acv) {
            myRepo.acv = acv;
            return updateDockerfileFromState($scope.state);
          })
        )
          .catch(errs.handler);
      }
    },
    data: {},
    active: false
  };

  this.fileUpload = {
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
          .error(function (err) {
            errs.handler(err);
            delete containerFile.file;
            delete containerFile.name;
            delete containerFile.progress;
            delete containerFile.fileUpload;
          })
          .success(function (fileResponse) {
            containerFile.uploadFinished = true;
            containerFile.name = fileResponse.name;
            containerFile.fileModel = $scope.state.contextVersion.newFile(fileResponse);
          })
          .finally(function () {
            containerFile.saving = false;
          });
      },
      save: function (containerFile) {
        if (!containerFile.type) {
          var ContainerFile = cardInfoTypes.File;
          var myFile = new ContainerFile();
          if (containerFile.file) {
            myFile.name = containerFile.file[0].name;
          }
          myFile.fromServer = true;
          myFile.fileModel = containerFile.fileModel;
          myFile.commands = containerFile.commands;
          myFile.path = containerFile.path;
          $scope.state.containerFiles.push(myFile);
          loadingPromises.add('editServerModal', updateDockerfileFromState($scope.state));
        }
        $rootScope.$broadcast('close-popovers');
      },
      cancel: function (containerFile) {
        // Using our own cancel in order to delete file
        if (containerFile.fileUpload) {
          if (containerFile.uploadFinished) {
            // If the upload is finished we need to trigger a delete on the server
            return self.fileUpload.actions.deleteFile(containerFile);
          }
          // The upload isn't finished. Abort it!
          containerFile.fileUpload.abort();
        }
        // Don't close-popovers when deleting the file, since that function will call it as well
        $rootScope.$broadcast('close-popovers');
      },
      deleteFile: function (containerFile) {
        $rootScope.$broadcast('close-popovers');

        var file = containerFile.fileModel || $scope.state.contextVersion.rootDir.contents.models.find(function (fileModel) {
            return fileModel.attrs.name === containerFile.name;
          });
        if (file) {
          var containerIndex = $scope.state.containerFiles.indexOf(containerFile);
          if (containerIndex > -1) {
            $scope.state.containerFiles.splice(containerIndex, 1);
          }

          return loadingPromises.add('editServerModal',
            promisify(file, 'destroy')()
              .then(function () {
                return updateDockerfileFromState($scope.state);
              })
              .catch(errs.handler)
          );
        }

      }
    },
    data: {}
  };

  this.dropContainerFile = function (event, newIndex, containerFileId) {
    var currentIndex = 0;
    var containerFile = $scope.state.containerFiles.find(function (containerFile, index) {
      currentIndex = index;
      return containerFile.id === containerFileId;
    });
    if (newIndex > 0 && currentIndex <= newIndex - 1) {
      newIndex -= 1;
    }
    $scope.state.containerFiles.splice(currentIndex, 1);
    $scope.state.containerFiles.splice(newIndex, 0, containerFile);
    // DO NOT RETURN THIS!  DND list will think it goes to the list
    loadingPromises.add('editServerModal', updateDockerfileFromState($scope.state))
      .catch(errs.handler);
  };

  this.sshKey = {
    popover: {
      active: false,
      actions: {
        save: function (data) {
          if ($scope.state.containerFiles.find(hasKeypaths({name: data.name}))) {
            return errs.handler(new Error('An SSH key of the same name already exists'));
          }
          var sshKey = new cardInfoTypes.SSHKey();
          sshKey.name = data.name;
          $scope.state.containerFiles.unshift(sshKey);

          loadingPromises.add(
            'editServerModal',
            promisify($scope.state.contextVersion.rootDir.contents, 'create')({
              name: sshKey.name,
              path: '/',
              body: data.key,
              isDir: false
            })
              .then(function (file) {
                sshKey.fileModel = file;
                return promisify($scope.state.contextVersion.rootDir.contents, 'fetch')();
              })
              .catch(errs.handler)
              .finally(function () {
                return updateDockerfileFromState($scope.state);
              })
          );
          $rootScope.$broadcast('close-popovers');
        },
        remove: function (sshKeyFile) {
          var file = sshKeyFile.fileModel || $scope.state.contextVersion.rootDir.contents.models.find(function (fileModel) {
            return fileModel.attrs.name === sshKeyFile.name;
          });
          var containerIndex = $scope.state.containerFiles.indexOf(sshKeyFile);
          if (containerIndex > -1) {
            $scope.state.containerFiles.splice(containerIndex, 1);
          }

          if (file) {
            loadingPromises.add(
              'editServerModal',
              promisify(file, 'destroy')()
                .then(function () {
                  return promisify($scope.state.contextVersion.rootDir.contents, 'fetch')();
                })
                .catch(errs.handler)
                .finally(function () {
                  return updateDockerfileFromState($scope.state);
                })
            );
          } else {
            loadingPromises.add('editServerModal', updateDockerfileFromState($scope.state))
              .catch(errs.handler);
          }
          $rootScope.$broadcast('close-popovers');
        }
      }
    },
    getFileDate: function (sshKeyFile) {
      var file = sshKeyFile.fileModel || $scope.state.contextVersion.rootDir.contents.models.find(function (fileModel) {
          return fileModel.attrs.name === sshKeyFile.name;
        });
      sshKeyFile.fileModel = file;

      return keypather.get(file, 'attrs.created');
    }
  };

  this.actions = {
    triggerAddRepository: function () {
      self.repositoryPopover.data = {
        appCodeVersions: $scope.state.contextVersion.appCodeVersions.models
      };
      self.repositoryPopover.active = true;
      $timeout(function () {
        self.repositoryPopover.active = false;
      });
    },
    triggerEditRepo: function (repo) {
      if (repo.type === 'Main Repository') { return; }
      self.repositoryPopover.data = {
        repo: repo.clone(),
        appCodeVersions: $scope.state.contextVersion.appCodeVersions.models
      };
      self.repositoryPopover.active = true;
      $timeout(function () {
        self.repositoryPopover.active = false;
      });
    },
    triggerUploadFile: function () {
      self.fileUpload.data = {};
      self.fileUpload.active = true;
      $timeout(function () {
        self.fileUpload.active = false;
      });
    },
    triggerEditFile: function (file) {
      self.fileUpload.data = file;
      self.fileUpload.active = true;
      $timeout(function () {
        self.fileUpload.active = false;
      });
    },
    triggerAddSSHKey: function () {
      self.sshKey.popover.active = true;
      $timeout(function () {
        self.sshKey.popover.active = false;
      });
    }
  };

  this.filePopoverActions = {
    edit: function (containerFile) {
      if (containerFile.type === 'Repository') {
        self.actions.triggerEditRepo(containerFile);
      } else if (containerFile.type === 'File'){
        self.actions.triggerEditFile(containerFile);
      }
    },
    delete: function (containerFile) {
      if (containerFile.type === 'Repository') {
        self.repositoryPopover.actions.remove(containerFile);
      } else if (containerFile.type === 'File') {
        self.fileUpload.actions.deleteFile(containerFile);
      } else if (containerFile.type === 'SSH Key') {
        self.sshKey.popover.actions.remove(containerFile);
      }
    }
  };
}