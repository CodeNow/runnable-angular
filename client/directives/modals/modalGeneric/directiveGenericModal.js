'use strict';

require('app')
  .directive('modalGeneric', modalGeneric);
/**
 * directive modalGeneric
 * @ngInject
 */
function modalGeneric(
) {
  return {
    restrict: 'E',
    templateUrl: function (elem, attrs) {
      if (attrs.type) {
        return attrs.type;
      } else {
        throw new Error('linkedInstances requires a type of modal or sidebar');
      }
    },
    scope: {
      data: '=',
      actions: '=',
      defaultActions: '='
    },
    link: function ($scope, element, attrs) {
      // Add thing
    }
  };
}
