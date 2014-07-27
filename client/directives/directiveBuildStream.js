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
    templateUrl: 'viewBuildStream',
    link: function ($scope, elem) {

      $scope.dataBuild.actions.initStream = function () {
        var build = $scope.dataBuild.data.build;

        if (build.attrs.completed) {
          $scope.dataBuild.data.closed = true;
          return;
        }

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

      var initalizer = $scope.$watch('dataBuild.data.build', function (n) {
        if (n) {
          $scope.dataBuild.actions.initStream();
          initalizer();
        }
      });
    }
  };
}
