'use strict';

require('app')
  .directive('fileTreeDir', fileTreeDir);
/**
 * fileTreeDir Directive
 * @ngInject
 */
function fileTreeDir(
  $rootScope,
  keypather,
  uploadFile,
  errs,
  $q,
  promisify,
  helperCreateFS,
  configAPIHost
) {
  return {
    restrict: 'A',
    replace: true,
    scope: {
      dir: '=',
      parentDir: '=',
      fileModel: '=', // This is either a contextVersion or a container
      openItems: '=',
      readOnly: '=',
      editExplorer: '=',
      showRepoFolder: '=',
      isRootDir: '=?'
    },
    templateUrl: 'viewFileTreeDir',
    link: function ($scope, element, attrs) {

      var actions = $scope.actions = {};
      $scope.data = {};
      var inputElement = element[0].querySelector('input.tree-input');

      $scope.editFolderName = false;
      $scope.editFileName = false;
      $scope.data = {};

      $scope.normalizeRepoNames = function (repo) {
        return repo.replace(/[a-zA-Z0-9]+\//, '');
      };


      $scope.actions.shouldCloseFolderNameInput = function (event) {
        if (event.keyCode === 13) {
          $scope.actions.closeFolderNameInput();
        } else if (event.keyCode === 27) {
          $scope.editFolderName = false;
          inputElement.value = $scope.dir.attrs.name;
        }
      };

      $scope.actions.closeFolderNameInput = function () {
        if (!$scope.editFolderName) {
          return;
        }
        $scope.editFolderName = false;
        var newValue = inputElement.value;
        if (newValue) {
          newValue = newValue.trim();
        }
        if (newValue === $scope.dir.attrs.name) {
          return;
        }
        $scope.dir.rename(newValue, errs.handler);
      };

      actions.handleClickOnFolderInput = function (event) {
        if ($scope.editFolderName) {
          $rootScope.$broadcast('close-popovers');
          event.preventDefault();
          event.stopPropagation();
        }
      };

      $scope.actions.shouldCloseFileNameInput = function (event, file) {
        if (event.keyCode === 13) {
          $scope.actions.closeFileNameInput(event, file);
        } else if (event.keyCode === 27) {
          file.state.renaming = false;
          event.currentTarget.value = file.attrs.name;
        }
      };
      $scope.actions.closeFileNameInput = function (event, file) {
        if (!file.state.renaming) {
          return;
        }
        file.state.renaming = false;

        var newValue = event.currentTarget.value;
        if (newValue) {
          newValue = newValue.trim();
        }
        if (newValue === file.attrs.name) {
          return;
        }
        file.rename(newValue, errs.handler);
      };

      actions.handleClickOnFileInput = function (event, file) {
        if (file.state.renaming) {
          $rootScope.$broadcast('close-popovers');
          event.preventDefault();
          event.stopPropagation();
        }
      };

      $scope.actions.drop = function (dataTransfer, toDir) {
        var modelType = dataTransfer.getData('modelType');
        var modelId = dataTransfer.getData('modelId');
        var modelName = dataTransfer.getData('modelName');

        var oldParentDirId = dataTransfer.getData('oldParentDirId');
        var oldPath = dataTransfer.getData('oldPath');
        var thisPath = toDir.id();
        if (oldPath === thisPath || (modelType === 'Dir' &&
            thisPath.indexOf(modelName + '/') >= 0)) {
          return false;
        }

        var newModel = $scope.fileModel['new' + modelType](modelId, { warn: false });
        var droppedFileOrigDir =
            $scope.fileModel.newDir(oldParentDirId, { warn: false, noStore: true });

        promisify(newModel, 'moveToDir')(toDir).then(function () {
          return $q.all([
            promisify(droppedFileOrigDir.contents, 'fetch')(),
            promisify(toDir.contents, 'fetch')()
          ]);
        });
      };

      actions.closeOpenModals = function () {
        $rootScope.$broadcast('app-document-click');
      };

      actions.openFile = function (file) {
        $scope.openItems.add(file);
      };

      $scope.getFileStyle = function (file) {
        if (!file.state.uploading) {
          return {};
        }
        return {
          width: file.state.progress + '%'
        };
      };

      $scope.popoverFileExplorerFolder = {
        data: {
          canUpload: $scope.editExplorer
        },
        options: {
          top: -16,
          left: 10,
          mouse: true
        },
        actions: {
          createFile: function () {
            helperCreateFS($scope.dir, {
              isDir: false
            }, errs.handler);
            $scope.$broadcast('close-popovers');
          },
          createFolder: function () {
            helperCreateFS($scope.dir, {
              isDir: true
            }, errs.handler);
            $scope.$broadcast('close-popovers');
          },
          renameFolder: function () {
            $scope.editFolderName = true;
            inputElement.focus();
            inputElement.select();
            $scope.$broadcast('close-popovers');
          },
          deleteFolder: function () {
            $scope.dir.destroy(errs.handler);
            $scope.$broadcast('close-popovers');
          },
          uploadFiles: function (files) {
            if (files && files.length) {
              $scope.$broadcast('close-popovers');

              var uploadURL = configAPIHost + '/' + $scope.fileModel.urlPath + '/' + $scope.fileModel.id() + '/files';
              var fileUploadPromises = files.map(function (file) {
                var myFile = {
                  attrs: {
                    name: file.name
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
                $scope.actions.fetchDirFiles();
              });
            }
          }
        }
      };

      $scope.popoverFileExplorerFile = {
        canUpload: $scope.editExplorer,
        options: {
          top: -16,
          left: 10
        },
        actions: {
          openFile: function (file) {
            $scope.openItems.add(file);
            $scope.$broadcast('close-popovers');
          },
          renameFile: function (file) {
            keypather.set(file, 'state.renaming', true);
            $scope.$broadcast('close-popovers');
          },
          deleteFile: function (file) {
            file.destroy(function (err) {
              errs.handler(err);
              // destroy alone does not update collection
              $scope.actions.fetchDirFiles();
            });
            $scope.$broadcast('close-popovers');
          }
        }
      };

      // http://www.bennadel.com/blog/2495-user-friendly-sort-of-alpha-numeric-data-in-javascript.htm
      function normalizeMixedDataValue(file) {
        var padding = '000000000000000';
        // Loop over all numeric values in the string and
        // replace them with a value of a fixed-width for
        // both leading (integer) and trailing (decimal)
        // padded zeroes.
        var value = file.attrs.name.replace(
          /(\d+)((\.\d+)+)?/g,
          function ($0, integer, decimal, $3) {
            if (decimal !== $3) {
              return (
                padding.slice(integer.length) +
                integer +
                decimal
              );
            }
            decimal = (decimal || '.0');
            return (
              padding.slice(integer.length) +
              integer +
              decimal +
              padding.slice(decimal.length)
            );
          }
        );
        return value;
      }
      actions.normalizeMixedDataValue = normalizeMixedDataValue;

      function fetchDirFiles(file) {
        promisify($scope.dir.contents, 'fetch')().then(function () {
          if (file) {
            keypather.set(file, 'state.renaming', true);
          }
        }).catch(errs.handler);
      }
      actions.fetchDirFiles = fetchDirFiles;
      $scope.$watch('dir.state.open', function (newVal) {
        if (newVal) {
          fetchDirFiles();
        }
      });
    }
  };
}
