var jQuery = require('jquery');
require('jquery-ui');
//TODO serviceize for testing later

require('app')
  .directive('fileTreeDir', fileTreeDir);
/**
 * fileTreeDir Directive
 * @ngInject
 */
function fileTreeDir(
  $templateCache,
  $compile,
  $timeout,
  $rootScope,
  $state,
  async
) {
  return {
    restrict: 'E',
    scope: {
      dir: '=',
      openItems: '=',
      readOnly: '='
    },
    template: '',
    link: function ($scope, element, attrs) {

      var jQuery = require('jquery');
      var actions = $scope.actions = {};
      var data = $scope.data = {};
      $scope.state = $state;

      // avoid infinite loop w/ nested directories
      var template = $templateCache.get('viewFileTreeDir');
      var $template = angular.element(template);
      $compile($template)($scope);
      element.replaceWith($template);

      $scope.$on('$destroy', function () {
      });

      $scope.fileDroppable = false;
      actions.makeDroppable = function() {
        if ($scope.fileDroppable) {
          return;
        }
        $scope.fileDroppable = true;
        var $element = jQuery($template);

        $element.on('dragenter', function (event) {
          event.preventDefault();
          event.stopPropagation();

          $scope.dropping = true;
          $rootScope.safeApply();
        });

        // necessary
        $element.on('dragover', function (event) {
          event.preventDefault();
          event.stopPropagation();
        });

        $element.on('dragleave', function (event) {
          event.preventDefault();
          event.stopPropagation();

          $scope.dropping = false;
          $rootScope.safeApply();
        });

        $element.on('drop', function (event) {
          event.preventDefault();
          event.stopPropagation();

          var formData = new FormData();
          var path = $scope.dir.opts.client.host + '/' + $scope.dir.contents.urlPath;
          // originalEvent; event is jQuery.event
          var files = event.originalEvent.dataTransfer.files;
          var reader = new FileReader();
          reader.readAsText(files[0]);
          // invoked when read operation completes
          reader.onload = function () {
            sendFile();
          };

          function sendFile () {
            formData.append('file', reader.result);
            jQuery.ajax({
              url: path,
              type: 'POST',
              data: formData,
              mimeType: 'multipart/form-data',
              contentType: false,
              cache: false,
              processData: false,
              xhrFields: {
                withCredentials: true
              },
              success: function (data, textStatus, jqXHR) {
              },
              error: function (jqXHR, textStatus, error) {
              }
            });
          }

          $scope.dropping = false;
          $rootScope.safeApply();
          return false;
        });
      };

      actions.makeSortable = function () {
        var $t = jQuery($template);
        $t.find('> ul > li.file').draggable({
          revert: function (droppable) {
            var droppableScope = angular.element(droppable).scope();
            if (droppable && droppableScope && droppableScope.dir) {
              var fileOrigDir = angular.element(jQuery(this).parents('li.folder')).scope().dir;
              if (fileOrigDir === droppableScope.dir) {
                // dropping in same dir, revert
                return true;
              } else {
                // dropping in a new dir, OK
                return false;
              }
            } else {
              // dropping not in a directory
              return true;
            }
          },
          revertDuration: 100,
          drag: function () {
            data.dragging = true;
          }
        });

        $t.droppable({
          greedy: true,
          drop: function (event, item) {

            var droppedFileDirScope      = angular.element(item.draggable).scope(),
                droppedFile              = droppedFileDirScope.fs,
                droppedFileOrigDirScope = angular.element(jQuery(item.draggable).parents('li.folder')).scope(),
                droppedFileOrigDir       = droppedFileOrigDirScope.dir;

            if ($scope.dir === droppedFileOrigDir) {
              return;
            }

            async.series([
              function (cb) {
                droppedFile.moveToDir($scope.dir, cb);
                // TODO remove below after SAN-67 fix. Temp solution
                var i = droppedFileOrigDir.contents.models.indexOf(droppedFile);
                droppedFileOrigDir.contents.models.splice(i, 1);
              },
              function (cb) {
                async.parallel([
                  function (cb) {
                    droppedFileOrigDir.contents.fetch(cb);
                  },
                  function (cb) {
                    $scope.dir.contents.fetch(cb);
                  }
                ], function () {
                  $rootScope.safeApply();
                  cb();
                });
              }
            ], function () {});

          }
        });
      };

      actions.closeOpenModals = function () {
        $rootScope.$broadcast('app-document-click');
      };

      // http://www.bennadel.com/blog/2495-user-friendly-sort-of-alpha-numeric-data-in-javascript.htm
      actions.normalizeMixedDataValue = function(file) {
        var padding = '000000000000000';
        // Loop over all numeric values in the string and
        // replace them with a value of a fixed-width for
        // both leading (integer) and trailing (decimal)
        // padded zeroes.
        value = file.attrs.name.replace(
          /(\d+)((\.\d+)+)?/g,
          function($0, integer, decimal, $3) {
            if (decimal !== $3) {
              return(
                padding.slice(integer.length) +
                integer +
                decimal
              );
            }
            decimal = (decimal || ".0");
            return(
              padding.slice(integer.length) +
              integer +
              decimal +
              padding.slice(decimal.length)
            );
          }
        );
        return value;
      };

      actions.fetchDirFiles = function() {
        $scope.dir.contents.fetch(function (err) {
          $rootScope.safeApply(function () {
            if (!$scope.readOnly) {
              actions.makeSortable();
            }
          });
          if (err) {
            throw err;
          }
        });
      };

      $scope.$watch('dir.state.open', function (newVal, oldval) {
        if (newVal) {
          actions.fetchDirFiles();
        }
      });

      $scope.$watch('dir.contents.models.length', function () {
        if ($scope.readOnly) {
          return;
        }
        $timeout(function () {
          // timeout necessary to ensure rg-repeat completes
          // before trying to apply draggable to li's
          $scope.actions.makeSortable();
          $scope.actions.makeDroppable();
        }, 1);
      });

    }
  };
}
