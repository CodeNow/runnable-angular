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

      $scope.streamData = primusBuild.getCache();

      primusBuild.connection.on('data', function (data) {
        $scope.streamData += data;
        $scope.safeApply();
      });
    }
  };
}
