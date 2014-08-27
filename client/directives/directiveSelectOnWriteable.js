require('app')
  .directive('selectOnWriteable', selectOnWriteable);
/**
 * @ngInject
 */
function selectOnWriteable() {
  return {
    restrict: 'A',
    link: function ($scope, elem) {
      $scope.$watch('fs.state.renaming', function (n) {
        elem[0].focus();
        elem[0].select();
      });
    }
  };
}