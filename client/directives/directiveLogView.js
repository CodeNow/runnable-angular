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
      container: '='
    },
    templateUrl: 'viewBuildStream',
    link: function ($scope, elem) {
      $scope.stream = {
        data: ''
      };

      $scope.getStream = function () {
        return $sce.trustAsHtml($filter('buildStreamCleaner')($scope.stream.data || ''));
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
