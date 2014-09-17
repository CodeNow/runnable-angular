require('app')
  .directive('selectOn', selectOn);
/**
 * @ngInject
 */
function selectOn() {
  return {
    restrict: 'A',
    link: function ($scope, elem, attrs) {
      $scope.$watch(attrs.selectOn, function (n) {
        if (!n) return;
        elem[0].focus();
        elem[0].select();
      });
    }
  };
}
