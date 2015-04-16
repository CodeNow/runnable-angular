'use strict';

require('app')
  .directive('fancyOption', fancySelect);
/**
 * @ngInject
 */
function fancySelect(
  $document
) {
  return {
    restrict: 'E',
    scope: {
      'value': '='
    },
    transclude: true,
    templateUrl: 'viewFancyOption',
    link: function ($scope, element, attrs, controller, transcludeFn) {
      var transcludedContent;
      var transclusionScope;

      // This is a fancy-option which always lives as a child to fancy-select.
      // We need to communicate the option and it's click events to the parent.
      $scope.config = {
        value: $scope.value,
        selected: false,
        element: element.find('li')
      };

      $scope.actions = {
        clickedOption: function () {
          $scope.$parent.actions.clickedOption($scope.config);
        }
      };

      $scope.$parent.registerOption($scope.config);

      transcludeFn($scope, function(clone, innerScope ){
        element.find('li').append(clone);
        transcludedContent = clone;
        transclusionScope = innerScope;
      });
    }
  };
}
