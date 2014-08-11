require('app')
  .directive('logView', logView);
/**
 * @ngInject
 */
function logView(
  $rootScope,
  primus
) {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      container: '='
    },
    templateUrl: 'viewLogStream',
    link: function ($scope, elem) {
      $scope.stream = {
        data: ''
      };

      var init = function () {
        if (!$scope.container) {
          throw new Error('Container is required');
        }
        var logStream = primus.createLogStream($scope.container);
        logStream.on('data', function(data) {
          $scope.stream.data += data;
          $rootScope.safeApply();
        });
      };

      $scope.$watch('container.attrs._id', function (containerId) {
        if (containerId) {
          init();
        }
      });
    }
  };
}