'use strict';

require('app')
  .directive('explorer', explorer);
/**
 * @ngInject
 */
function explorer(
  $q,
  uploadFile,
  configAPIHost,
  errs,
  helperCreateFS,
  promisify,
  $localStorage,
  $timeout
) {
  return {
    restrict: 'A',
    templateUrl: 'viewExplorer',
    scope: {
      openItems: '=',
      fileModel: '=',
      rootDir: '=',
      explorerTitle: '@',
      toggleTheme: '=',
      showRepoFolder: '=',
      editExplorer: '=?',
      loadingPromisesTarget: '@?',
      readOnly: '=?'
    },
    link: function ($scope, elem, attrs) {
      $scope.$storage = $localStorage.$default({
        explorerIsClosed: false
      });
      $scope.state = {};

      $scope.filePopover = {
        data: {
          show: false,
          canUpload: $scope.editExplorer,
          canAddRepo: $scope.editExplorer
        },
        actions: {
          createFile: function () {
            helperCreateFS($scope.rootDir, {
              isDir: false
            }, errs.handler);
            $scope.$broadcast('close-popovers');
          },
          addRepository: function () {
            $scope.$broadcast('close-popovers');
            $scope.showAddRepo = false;
            $timeout(function () {
              $scope.state.showAddRepo = true;
            });
          },
          createFolder: function() {
            helperCreateFS($scope.rootDir, {
              isDir: true
            }, errs.handler);
            $scope.$broadcast('close-popovers');
          },
          uploadFiles: function (files) {
            if (files && files.length) {
              $scope.$broadcast('close-popovers');

              var uploadURL = configAPIHost + '/' + $scope.rootDir.urlPath;
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

                $scope.rootDir.contents.models.push(myFile);
                return uploadFile(file, uploadURL)
                  .progress(function (evt) {
                    myFile.state.progress = parseInt(100.0 * evt.loaded / evt.total, 10);
                  })
                  .then(function () {
                    myFile.state.progress = 100;
                  })
                  .catch(function (err) {
                    var fileIndex = $scope.rootDir.contents.models.indexOf(myFile);
                    $scope.rootDir.contents.models.splice(fileIndex, 1);
                    errs.handler(err);
                  })
                  .then(function () {
                    return myFile;
                  });

              });

              $q.all(fileUploadPromises).then(function (uploads) {
                uploads.forEach(function (myFile) {
                  var fileIndex = $scope.rootDir.contents.models.indexOf(myFile);
                  if (fileIndex !== -1) {
                    $scope.rootDir.contents.models.splice(fileIndex, 1);
                  }
                });
              }).then(function () {
                return promisify($scope.rootDir.contents, 'fetch')();
              });
            }
          }
        }
      };

      $scope.$watch('rootDir', function (rootDir) {
        if (!rootDir) { return; }
        initRootDirState(rootDir);
      });

      function initRootDirState (rootDir) {
        rootDir.state = rootDir.state || {};
        rootDir.state.open = true;
      }
    }
  };
}
