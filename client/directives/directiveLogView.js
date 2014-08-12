require('app')
  .directive('logView', logView);
/**
 * @ngInject
 */
function logView(
  $rootScope,
  jQuery,
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
    }
  };
}