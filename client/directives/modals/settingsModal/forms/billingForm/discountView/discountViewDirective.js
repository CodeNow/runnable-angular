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
          return moment($scope.discount.end).fromNow(true) + ' Remaining';
        }
        return 'for ' + (moment($scope.discount.end).diff($scope.discount.start, 'months') + 1) + ' months';
      };
    }
  };
}
