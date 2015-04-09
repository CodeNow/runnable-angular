'use strict';

require('app')
  .directive('fancySelect', fancySelect);
/**
 * @ngInject
 */
function fancySelect(
  $document
) {
  return {
    restrict: 'E',
    templateUrl: 'viewFancySelect',
    transclude: true,
    link: function ($scope, element, attrs, controller, transcludeFn) {
      var transcludedContent;
      var transclusionScope;

      var list =  element.find('ul');
      //$scope.isOpen = false;
      //
      //$scope.actions = {
      //  toggleSelect: function () {
      //    console.log('Toggle Select');
      //    $scope.open = true;
      //
      //  },
      //  updateSelect: function (evt) {
      //    console.log('Updating select', evt);
      //  }
      //};


      transcludeFn($scope, function(clone, innerScope ){
        list.append(clone);
        transcludedContent = clone;
        transclusionScope = innerScope;
      });
    }
  };
}
