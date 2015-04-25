'use strict';

require('app')
  .directive('explorer', explorer);
/**
 * @ngInject
 */
function explorer(
  $q,
  $upload,
  configAPIHost,
  errs,
  helperCreateFS,
  promisify,
  $localStorage
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
      editExplorer: '='
    },
    link: function ($scope, elem, attrs) {
      $scope.$storage = $localStorage.$default({
        explorerIsClosed: false
      });

      $scope.filePopover = {
        data: {
          show: false,
          canUpload: $scope.editExplorer
        },
        actions: {
          createFile: function() {
            helperCreateFS($scope.rootDir, {
              isDir: false
            }, errs.handler);
            $scope.$broadcast('close-popovers');
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
                    name: file.name
                  },
                  state: {
                    uploading: true,
                    progress: 0
                  }
                };

                $scope.rootDir.contents.models.push(myFile);
                return $upload.upload({
                  url: uploadURL,
                  file: file,
                  method: 'POST',
                  fileFormDataName: 'file',
                  withCredentials: true
                })
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
                promisify($scope.rootDir, 'fetch')();
              });
            }
          }
        }
      };

      var unwatch = $scope.$watch('rootDir', function (rootDir) {
        if (!rootDir) { return; }
        unwatch();
        initRootDirState(rootDir);
      });

      function initRootDirState (rootDir) {
        rootDir.state = rootDir.state || {};
        rootDir.state.open = true;
      }
    }
  };
}
