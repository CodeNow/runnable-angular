require('app')
  .directive('buildStream', buildStream);
/**
 * @ngInject
 */
function buildStream(
  $location,
  $anchorScroll,
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

      var initStream = function () {
        var build = $scope.build;

        if (build.attrs.completed) {
          elem.addClass('out');
          return;
        }

        elem.removeClass('out');

        var streamId = build.attrs._id + '-' + Date.now();
        var buildPrimusStream = primus({
          id: 1,
          event: 'build-stream',
          data: {
            id: build.contextVersions.models[0].attrs._id,
            streamId: streamId
          }
        }).substream(streamId);

        elem.on('$destroy', function () {
          if (buildPrimusStream && !$scope.dataBuild.data.finishedBuild) {
            buildPrimusStream.end();
          }
        });

        var addToStream = function (data) {console.log(data);
          $scope.stream.data += data;
          $scope.safeApply();
          $anchorScroll();
        };

        $scope.stream = {
          finished: false
        };
        $scope.stream.data = '';

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
            $scope.safeApply();
          });

          buildPrimusStream.end();
        });
      };

      $scope.$watch('build.attrs._id', function (buildId) {
        if (buildId) {
          initStream();
        }
      });
    }
  };
}
