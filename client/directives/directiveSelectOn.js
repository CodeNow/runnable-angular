'use strict';

require('app')
  .directive('selectOn', selectOn);
/**
 * @ngInject
 */
function selectOn() {
  return {
    restrict: 'A',
    priority: -1,
    link: function ($scope, elem, attrs) {
      if (!attrs.selectOn) {
        elem[0].focus();
        elem[0].select();
        return;
      }
      $scope.$watch(attrs.selectOn, function (n) {
        if (!n) { return; }
        elem[0].focus();
        elem[0].select();
      });
    }
  };
}
