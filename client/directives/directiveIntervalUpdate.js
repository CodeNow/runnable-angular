require('app')
  .directive('intervalUpdate', intervalUpdate);
/**
 * @ngInject
 */
function intervalUpdate (
  $interval
) {
  return {
    restrict: 'A',
    scope: false,
    link: function ($scope, elem, attrs) {
      var intervalTime = parseInt(attrs.intervalUpdateMs);
      var promise = $interval(function () {
        $scope.safeApply();
      }, intervalTime);
      $scope.$on('$destroy', function () {
        $interval.cancel(promise);
      });
    }
  };
}
