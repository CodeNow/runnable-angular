require('app')
  .directive('buildStream', buildStream);
/**
 * @ngInject
 */
function buildStream(
  $rootScope,
  $filter,
  $sce,
  jQuery,
  primus
) {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      build: '='
    },
    templateUrl: 'viewBuildStream',
    link: function ($scope, elem) {

      $scope.stream = {
        data: ''
      };

      $scope.getStream = function () {
        return $sce.trustAsHtml($filter('buildStreamCleaner')($scope.stream.data || ''));
      };

      $scope.$watch('build.attrs._id', function (buildId, oldVal) {
        if (buildId) {
          var build = $scope.build;
          if (build.succeeded()) {
            $scope.build.contextVersions.models[0].fetch(function (err, data) {
              if (err) {
                throw err;
              }
              $scope.stream.data = data.build.log;
              $rootScope.safeApply();
            });
          } else if (build.failed()) {
            var contextVersion = build.contextVersions.models[0];
            if (contextVersion && contextVersion.attrs.build) {
              $scope.stream = {
                data: contextVersion.attrs.build.log ||
                  (contextVersion.attrs.build.error && contextVersion.attrs.build.error.message) ||
                  'Unknown Build Error Occurred'
              };
            } else {
              $scope.stream = {
                data: 'Unknown Build Error Occurred'
              };
            }
            // check contextVersions.attrs.build.error for unknown errors
            $rootScope.safeApply();
          } else { // build in progress
            initStream();
          }
        }
      });

      function initStream() {
        var build = $scope.build;
        var buildStream = primus.createBuildStream(build);
        var $streamElem = jQuery(elem).find('pre');
        var addToStream = function (data) {
          $scope.stream.data += data;
          $rootScope.safeApply(function () {
            $streamElem.scrollTop(10000);
          });
        };
        buildStream.on('data', addToStream);
        buildStream.on('end', function () {
          build.fetch(function (err) {
            if (err) {
              throw err;
            }
            if (!build.succeeded()) {
              // bad things happened
              addToStream('BUILD BROKEN: Please try again');
            } else {
              // we're all good
              addToStream('BUILD SUCCESSFUL');
            }
            $rootScope.safeApply();
          });
        });
      }
    }
  };
}
