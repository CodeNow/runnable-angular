require('app')
  .directive('buildStream', buildStream);
/**
 * @ngInject
 */
function buildStream(
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

      primusBuild.connection.on('data', function (data) {
        $scope.stream.data += data;
        $scope.safeApply();
      });

      primusBuild.connection.on('end', function () {
        primusBuild.connection.destroy();
        $scope.stream.finished = true;
      });
    }
  };
}
