require('app')
  .directive('buildStream', buildStream);
/**
 * @ngInject
 */
function buildStream(
  $location,
  $anchorScroll,
  primusBuild
) {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: 'viewBuildStream',
    link: function ($scope, elem) {

      $scope.closed = false;

      function init() {
        var build = $scope.dataBuild.data.build;
        var buildStream = primusBuild(build.attrs.contextVersions[0]);

        elem.on('$destroy', function () {
          if (buildStream && !$scope.dataBuild.data.finishedBuild) {
            buildStream.connection.end();
          }
        });

        var addToStream = function (data) {
          $scope.stream.data += data;
          $scope.safeApply();
          $anchorScroll();
        };

        $scope.stream = {
          finished: false
        };
        $scope.stream.data = buildStream.getCache();

        $location.hash('scroll-to');

        buildStream.connection.on('data', addToStream);

        buildStream.connection.on('end', function () {
          build.fetch(function (err, data) {
            if (err) {
              alert('an error happened');
              console.log(err);
            } else {
              $scope.dataBuild.data.finishedBuild = true;
              if (data.erroredContextVersions.length) {
                // bad things happened
                addToStream('BUILD BROKEN: Please try again');
              } else {
                // we're all good
                addToStream('BUILD SUCCESSFUL');
                $scope.dataBuild.data.successfulBuild = true;
              }
            }
            $scope.safeApply();
          });

          buildStream.connection.end();
          $scope.stream.finished = true;
        });
      }

      var initalizer = $scope.$watch('dataBuild.data.build', function (n) {
        if (n) {
          init();
          initalizer();
        }
      });
    }
  };
}
