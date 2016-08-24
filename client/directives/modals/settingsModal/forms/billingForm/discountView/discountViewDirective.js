'use strict';

require('app').directive('discountView', discountView);

function discountView(
  moment
) {
  return {
    restrict: 'A',
    templateUrl: 'discountView',
    scope: {
      discount: '=',
      hasDuration: '=?'
    },
    link: function ($scope) {
      $scope.getDiscountTime = function () {
        if ($scope.hasDuration) {
          return moment($scope.discount.end).from($scope.discount.start, true);
        }
        return moment($scope.discount.end).fromNow(true);
      };
    }
  };
}
