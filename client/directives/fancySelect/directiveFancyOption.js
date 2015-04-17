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

      $scope.$watch('value', function (newVal) {
        $scope.config.value = newVal;
      });

      transcludeFn($scope, function(clone){
        element.find('li').append(clone);
      });
    }
  };
}
