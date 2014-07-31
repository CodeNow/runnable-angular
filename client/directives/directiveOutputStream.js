require('app')
  .directive('outputStream', outputStream);
/**
 * @ngInject
 */
function outputStream(
  $rootScope,
  jQuery,
  primus
) {
  return {
    restrict: 'E',
    replace: true,
    scope:  {
      container: '='
    },
    templateUrl: 'viewOutputStream',
    link: function ($scope, elem) {

      $scope.close = function () {
        $scope.out = true;
      };

      $scope.$watch('container.attrs._id', function (containerId, oldVal) {
        /*
        if (containerId) {
          var container = $scope.container;
          if (container.succeeded()) {
            $scope.out = true;
            $rootScope.safeApply();
          }
          else { // in progress
            initStream();
          }
        }
        */
        initStream();
      });

      function initStream () {
        var container = $scope.container;
        $scope.stream = {
          finished: false,
          data: ''
        };

        var logStream = primus.createLogStream(container);

        var addToStream = function (data) {
          $scope.stream.data += data;
          $rootScope.safeApply();
          jQuery('html, body').scrollTop(10000);
        };

        logStream.on('data', addToStream);

        logStream.on('end', function () {
          /*
          container.fetch(function (err) {
            if (err) {
              throw err;
            }
            $rootScope.safeApply();
          });
          */
        });
      }
    }
  };
}
