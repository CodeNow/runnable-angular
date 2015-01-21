'use strict';

require('app')
  .directive('selectOn', selectOn);
/**
 * @ngInject
 */
function selectOn(
  jQuery
) {
  return {
    restrict: 'A',
    priority: -1,
    link: function ($scope, elem, attrs) {
      if (!attrs.selectOn) {
        jQuery(elem[0]).focus();
        jQuery(elem[0]).select();
        return;
      }
      $scope.$watch(attrs.selectOn, function (n) {
        if (!n) { return; }
        jQuery(elem[0]).focus();
        jQuery(elem[0]).select();
      });
    }
  };
}
