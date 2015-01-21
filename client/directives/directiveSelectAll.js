'use strict';

require('app')
  .directive('selectAll', selectAll);

/**
 * @ngInject
 */
function selectAll() {
  return {
    restrict: 'A',
    link: function ($scope, elem) {
      elem.on('click', function () {
        this.select();
      });
    }
  };
}
