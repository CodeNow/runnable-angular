'use strict';

require('app')
  .directive('fancySelect', fancySelect);
/**
 * @ngInject
 */
function fancySelect(
) {
  return {
    restrict: 'E',
    scope: {
      value: '='
    },
    templateUrl: 'viewInstanceBoxName',
    link: function ($scope, elem, attrs) {
      console.log('Fancy Select!');
      console.log(elem);
    }
  };
}
