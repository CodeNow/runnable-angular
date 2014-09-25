require('app')
  .directive('logView', logView);
/**
 * @ngInject
 */
function logView(
  $rootScope,
  $filter,
  $timeout,
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

      var $streamElem = jQuery(elem).find('pre');
      $scope.stream = {
        data: ''
      };
      function onDataCallback (data) {
        parseData($scope.stream.data + data);
      }
      // invoked via directive when data has changed
      function parseData(data) {
        $scope.stream.data = $filter('buildStreamCleaner')(data);
        $rootScope.safeApply();
      }
      // invoked via angular every digest cycle
      $scope.getStream = function () {
        $timeout(function () {
          $streamElem.scrollTop($streamElem[0].scrollHeight);
        }, 1);
        return $sce.trustAsHtml($scope.stream.data);
      };

      if (attrs.build) {
        $scope.$watch('build.attrs._id', function (buildId, oldVal) {
          if (!buildId) {
            return;
          }
          var build = $scope.build;
          if (build.succeeded()) {
            build.contextVersions.models[0].fetch(function (err, data) {
              if (err) {
                throw err;
              }
              parseData(data.build.log);
            });
          } else if (build.failed()) {
            var contextVersion = build.contextVersions.models[0];
            if (contextVersion && contextVersion.attrs.build) {
              var data = contextVersion.attrs.build.log ||
                (contextVersion.attrs.build.error && contextVersion.attrs.build.error.message) ||
                'Unknown Build Error Occurred';
              parseData(data);
            } else {
              parseData('Unknown Build Error Occurred');
            }
          } else { // build in progress
            initBuildStream();
          }
        });
        var initBuildStream = function () {
          var build = $scope.build;
          var buildStream = primus.createBuildStream($scope.build);
          buildStream.on('data', onDataCallback);
          buildStream.on('end', function () {
            build.fetch(function (err) {
              if (err) {
                throw err;
              }
              if (!build.succeeded()) {
                // bad things happened
                parseData('BUILD BROKEN: Please try again');
              } else {
                // we're all good
                parseData('Build completed, starting instance...');
              }
            });
          });
        };

      } else if (attrs.container) {
        var initBoxStream = function () {
          var container = $scope.container;
          var boxStream = primus.createLogStream($scope.container);
          boxStream.on('data', onDataCallback);
        };
        $scope.$watch('container.attrs._id', function (containerId) {
          if (containerId) {
            initBoxStream();
          }
        });
      } else {
        throw new Error('improper use of directiveLogView');
      }

    }
  };
}
