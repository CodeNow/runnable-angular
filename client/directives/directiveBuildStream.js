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
    templateUrl: 'buildStream',
    link: function($scope, elem) {
      $scope.stream = {
        finished: false
      };
      $scope.stream.data = primusBuild.getCache();

      $location.hash('scroll-to');

      primusBuild.connection.on('data', function (data) {
        $scope.stream.data += data;
        $scope.safeApply();
        $anchorScroll();
      });

      primusBuild.connection.on('end', function () {
        primusBuild.connection.destroy();
        $scope.stream.finished = true;
      });
    }
  };
}
