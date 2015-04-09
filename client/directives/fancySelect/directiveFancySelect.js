'use strict';

require('app')
  .directive('fancySelect', fancySelect);
/**
 * @ngInject
 */
function fancySelect(
  $compile
) {
  return {
    restrict: 'E',
    templateUrl: 'viewFancySelect',
    transclude: true,
    link: function ($scope, element, attrs, controller, transcludeFn) {
      var transcludedContent;
      var transclusionScope;

      transcludeFn($scope, function(clone, innerScope ){
        element.find('ul').append(clone);
        transcludedContent = clone;
        transclusionScope = innerScope;
      });
    }
  };
}
