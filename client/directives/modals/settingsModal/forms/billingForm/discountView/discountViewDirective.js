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
      $scope.getDiscountText = function () {
        if ($scope.hasDuration) {
          return $scope.discount.coupon.percentOff + '% off until ' + moment($scope.discount.end).format('MMM Mo, YYYY');
        }
        return $scope.discount.coupon.percentOff + '% off for ' + $scope.discount.coupon.durationInMonths + ' months';
      };
    }
  };
}
