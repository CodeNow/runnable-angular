var term = require('term.js');
require('app')
  .directive('term', term);
/**
 * term Directive
 * @ngInject
 */
function term(
  primus
) {
  return {
    restrict: 'E',
    scope: {},
    link: function ($scope, element, attrs) {
    }
  };
}
