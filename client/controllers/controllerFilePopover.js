'use strict';

require('app')
  .controller('ControllerFilePopover', ControllerFilePopover);
/**
 * @ngInject
 */
function ControllerFilePopover(
  $q,
  uploadFile,
  configAPIHost,
  errs,
  promisify,
  $scope,
  loadingPromises,
  helperCreateFSpromise,
  $timeout
) {
  var self = this;
  this.dir = $scope.dir;
  this.loadingPromisesTarget = $scope.loadingPromisesTarget || 'generic';

  this.actions = {
    createFile: function () {
      loadingPromises.add(self.loadingPromisesTarget, helperCreateFSpromise($scope.dir, {
        isDir: false
      }))
        .catch(errs.handler);
      $scope.$broadcast('close-popovers');
    },
    createFolder: function () {
      loadingPromises.add(self.loadingPromisesTarget, helperCreateFSpromise($scope.dir, {
        isDir: true
      }))
        .catch(errs.handler);
      $scope.$broadcast('close-popovers');
    },
    renameFolder: function () {
      $scope.editFolderName = true;
      $scope.actions.focusInputElement();
      $scope.$broadcast('close-popovers');
    },
    deleteFolder: function () {
      loadingPromises.add(self.loadingPromisesTarget, promisify($scope.dir, 'destroy')())
        .catch(errs.handler);
      $scope.$broadcast('close-popovers');
    },
    uploadFiles: function (files) {
      if (files && files.length) {
        $scope.$broadcast('close-popovers');

        var uploadURL = configAPIHost + '/' + $scope.fileModel.urlPath + '/' + $scope.fileModel.id() + '/files';
        var fileUploadPromises = files.map(function (file) {
          var myFile = {
            attrs: {
              name: file.name,
              isDir: false
            },
            state: {
              uploading: true,
              progress: 0
            }
          };

          $scope.dir.contents.models.push(myFile);
          return uploadFile(file, uploadURL)
            .progress(function (evt) {
              myFile.state.progress = parseInt(100.0 * evt.loaded / evt.total, 10);
            })
            .then(function () {
              myFile.state.progress = 100;
            })
            .catch(function (err) {
              var fileIndex = $scope.dir.contents.models.indexOf(myFile);
              $scope.dir.contents.models.splice(fileIndex, 1);
              errs.handler(err);
            })
            .then(function () {
              return myFile;
            });

        });

        $q.all(fileUploadPromises).then(function (uploads) {
          uploads.forEach(function (myFile) {
            var fileIndex = $scope.dir.contents.models.indexOf(myFile);
            if (fileIndex !== -1) {
              $scope.dir.contents.models.splice(fileIndex, 1);
            }
          });

          promisify($scope.dir.contents, 'fetch')()
            .catch(function (err) {
              // We want to filter out this message because it's unhelpful to the user, and usually this
              // only happens if the instance is (temporarily) out of sync with the database.  If this
              // error happens, it's being taken care of at a higher level up from here
              if (err.message !== 'Container not found') {
                return errs.handler(err);
              }
            });
        });
      }
    },
    addRepository: function () {
      $scope.$broadcast('close-popovers');
      $scope.showAddRepo = false;
      $timeout(function () {
        $scope.state.showAddRepo = true;
      });
    },
  };
}
