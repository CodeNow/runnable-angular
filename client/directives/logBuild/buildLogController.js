'use strict';

require('app')
  .controller('BuildLogController', BuildLogController);
var DEFAULT_ERROR_MESSAGE = '\x1b[33;1mbuild failed\x1b[0m';
var DEFAULT_INVALID_BUILD_MESSAGE = '\x1b[31;1mPlease build again\x1b[0m';
var COMPLETE_SUCCESS_MESSAGE = 'Build completed, starting instance...';
/**
 * @ngInject
 */
function BuildLogController(
  keypather,
  $scope,
  primus,
  $log,
  promisify,
  $timeout
) {
  $scope.model = $scope.currentModel;
  $scope.showSpinnerOnStream = true;

  $scope.getStreamStatus = function () {
    return keypather.get($scope, 'model.build.attrs.id');
  };

  $scope.$watch('model.build.attrs.id', function (n) {
    if (n) {
      var build = $scope.model.build;
      if (build.failed() || build.succeeded()) {
        promisify(build.contextVersions.models[0], 'fetch')().then(function (data) {
          if (build.succeeded()) {
            $scope.$emit('WRITE_TO_TERM', data.attrs.build.log, true);
          } else if (build.failed()) {
            // defaulting behavior selects best avail error msg
            var cbBuild = keypather.get(build.contextVersion, 'attrs.build');
            var errorMsg = cbBuild.log || keypather.get(cbBuild, 'error.message') || DEFAULT_ERROR_MESSAGE;
            $scope.$emit('WRITE_TO_TERM', errorMsg, true);
          }
        }).catch(function (err) {
          return $log.error(err);
        });
      } else {

        $scope.$emit('STREAM_START', build);
      }
    }
  });

  $scope.createStream = function () {
    return primus.createBuildStream($scope.model.build);
  };

  $scope.streamEnded = function () {
    promisify($scope.model.build, 'fetch')().then(function (build) {
      $timeout(angular.noop);
      if (!build.succeeded()) {
        $scope.$emit('WRITE_TO_TERM', DEFAULT_INVALID_BUILD_MESSAGE);
      } else {
        $scope.$emit('WRITE_TO_TERM', COMPLETE_SUCCESS_MESSAGE);
      }
    }).catch(function (err) {
      $log.error(err);
    });
  };

}



