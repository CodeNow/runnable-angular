require('app')
  .directive('buildStream', buildStream);
/**
 * @ngInject
 */
function buildStream(
  $location,
  $anchorScroll,
  $rootScope,
  primus
) {
  return {
    restrict: 'E',
    replace: true,
    scope:  {
      build: '='
    },
    templateUrl: 'viewBuildStream',
    link: function ($scope, elem) {

      $scope.close = function () {
        $scope.out = true;
      };

      var initStream = function () {
        var build = $scope.build;
        $scope.stream = {
          finished: false,
          data: ''
        };

        if (build.attrs.completed) {
          $scope.out = true;
          return;
        }
        $scope.out = false;

        var streamId = build.attrs._id + '-' + Date.now();
        var buildPrimusStream = primus({
          id: 1,
          event: 'build-stream',
          data: {
            id: build.contextVersions.models[0].attrs._id,
            streamId: streamId
          }
        }).substream(streamId);

        var addToStream = function (data) {
          $scope.stream.data += data;
          $rootScope.safeApply();
          $anchorScroll();
        };

        $location.hash('log');

        buildPrimusStream.on('data', addToStream);

        buildPrimusStream.on('end', function () {
          build.fetch(function (err) {
            if (err) {
              throw err;
            }
            if (build.attrs.erroredContextVersions.length) {
              // bad things happened
              addToStream('BUILD BROKEN: Please try again');
            } else {
              // we're all good
              addToStream('BUILD SUCCESSFUL');
            }
            $rootScope.safeApply();
          });

          buildPrimusStream.end();
        });
      };


      $scope.$watch('build.attrs._id', function (buildId) {
        if (buildId) {
          initStream();
        }
      });

      elem.on('$destroy', function () {
        if (buildPrimusStream) {
          buildPrimusStream.end();
        }
      });
    }
  };
}
