'use strict';

var jQuery = require('jquery');
require('jquery-ui');

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
  async,
  keypather,
  configAPIHost
) {
  return {
    restrict: 'E',
    scope: {
      dir: '=',
      openItems: '=',
      readOnly: '=',
      build: '='
    },
    template: '',
    link: function ($scope, element, attrs) {

      var jQuery = require('jquery');
      var actions = $scope.actions = {};
      var data = $scope.data = {};
      $scope.state = $state;

      actions.makeDroppable = function () {
        if (!$template) { return; }

        $template[0].addEventListener('drop', function (event) {
          event.preventDefault();
          event.stopPropagation();
          var files = event.dataTransfer.files;

          var asyncCallbacks = [];
          Array.prototype.forEach.call(files, function (file, index) {
            (function (file, asyncCallbacks) {
              asyncCallbacks.push(function (file, cb) {
                var formData = new FormData();
                formData.append('file', file);
                jQuery.ajax({
                  url: configAPIHost + '/' + $scope.dir.urlPath,
                  type: 'POST',
                  contentType: false,
                  processData: false,
                  data: formData,
                  xhrFields: {
                    withCredentials: true
                  },
                  complete: function () {
                    cb();
                  },
                  error: function () {},
                  success: function () {}
                });
              }.bind(this, file));
            })(file, asyncCallbacks);
          });

          async.parallel(asyncCallbacks, function () {
            actions.fetchDirFiles();
          });
        }, true);

        $template[0].addEventListener('dragenter', function (event) {
          event.preventDefault();
          event.stopPropagation();
        });

        $template[0].addEventListener('dragover', function (event) {
          event.preventDefault();
          event.stopPropagation();
        });
      };

      actions.closeOpenModals = function () {
        $rootScope.$broadcast('app-document-click');
      };

      actions.openFile = function (file) {
        if (data.dragging) {
          data.dragging = false;
          return;
        }
        $scope.openItems.add(file);
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

            var droppedFileDirScope = angular.element(item.draggable).scope(),
              droppedFile = droppedFileDirScope.fs,
              droppedFileOrigDirScope = angular.element(jQuery(item.draggable).parents('li.folder')).scope(),
              droppedFileOrigDir = droppedFileOrigDirScope.dir;

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
                  cb();
                });
              }
            ], function () {});

          }
        });
      };

      // needed to observe change seed context version on setup page
      if ($state.$current.name === 'instance.setup') {
        $scope.$watch('build.contextVersions.models[0].source', function (newVal) {
          if (!newVal) { return; }
          fetchDirFiles();
          $scope.actions.makeDroppable();
        });
      }

      $scope.$watch('dir.state.open', function (newVal, oldval) {
        if (newVal) {
          fetchDirFiles();
          $scope.actions.makeDroppable();
        }
      });

      $scope.$watch('dir.contents.models.length', function () {
        if ($scope.readOnly) {
          return;
        }
        $timeout(function () {
          // timeout necessary to ensure ng-repeat completes
          // before trying to apply draggable to li's
          $scope.actions.makeSortable();
          //$scope.actions.makeDroppable();
        }, 1);
      });

      actions.fetchDirFiles = fetchDirFiles;
      function fetchDirFiles(file) {
        $scope.dir.contents.fetch(function (err) {
          if (file) {
            keypather.set(file, 'state.renaming', true);
          }
          if (!$scope.readOnly) {
            actions.makeSortable();
          }
          if (err) {
            throw err;
          }
        });
      }

      // avoid infinite loop w/ nested directories
      var template = $templateCache.get('viewFileTreeDir');
      var $template = angular.element(template);
      $compile($template)($scope);
      element.replaceWith($template);

      element.on('$destroy', function () {
        // IF BIND ANY EVENTS TO DOM, UNBIND HERE OR SUFFER THE MEMORY LEAKS
      });
    }
  };
}
