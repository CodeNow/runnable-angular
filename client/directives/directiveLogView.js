require('app')
  .directive('logView', logView);
/**
 * @ngInject
 */
function logView(
  $rootScope,
  $filter,
  jQuery,
  $sce,
  primus
) {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      container: '=',
      build: '='
    },
    templateUrl: 'viewLogView',
    link: function ($scope, elem, attrs) {

      $scope.stream = {
        data: ''
      };
      function parseData() {
        $scope.stream.data = $filter('buildStreamCleaner')($scope.stream.data);
        //$scope.stream.data = $sce.trustAsHtml($scope.stream.data);
      }
      $scope.getStream = function () {
        //return $scope.stream.data;
        return $sce.trustAsHtml($scope.stream.data);
      };

      if (attrs.build) {
        $scope.$watch('build.attrs._id', function (buildId, oldVal) {
          if (buildId) {
            var build = $scope.build;
            if (build.succeeded()) {
              $scope.build.contextVersions.models[0].fetch(function (err, data) {
                if (err) {
                  throw err;
                }
                $scope.stream.data = data.build.log;
                parseData();
              });
            } else if (build.failed()) {
              var contextVersion = build.contextVersions.models[0];
              if (contextVersion && contextVersion.attrs.build) {
                $scope.stream = {
                  data: contextVersion.attrs.build.log ||
                    (contextVersion.attrs.build.error && contextVersion.attrs.build.error.message) ||
                    'Unknown Build Error Occurred'
                };
                parseData();
              } else {
                $scope.stream = {
                  data: 'Unknown Build Error Occurred'
                };
              }
            } else { // build in progress
              initBuildStream();
            }
          }
        });
        var initBuildStream = function () {
          var build = $scope.build;
          var buildStream = primus.createBuildStream(build);
          var $streamElem = jQuery(elem).find('pre');
          var addToStream = function (data) {
            $scope.stream.data += data;
            parseData();
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
                addToStream('Build completed, starting instance...');
              }
              $rootScope.safeApply();
            });
          });
        };

      } else if (attrs.container) {

        var init = function () {
          if (!$scope.container) {
            throw new Error('Container is required');
          }
          var logStream = primus.createLogStream($scope.container);
          var $logBody = jQuery(elem).find('pre');
          logStream.on('data', function(data) {
            $scope.stream.data += data;
            $rootScope.safeApply(function() {
              if($logBody.scrollTop() + $logBody.innerHeight() + 20 >= $logBody[0].scrollHeight) {
                $logBody.scrollTop($logBody[0].scrollHeight);
              }
            });
          });
        };
        $scope.$watch('container.attrs._id', function (containerId) {
          if (containerId) {
            init();
          }
        });
      } else {
        throw new Error('improper use of directiveLogView');
      }

    }
  };
}
