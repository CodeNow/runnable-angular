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
          return $scope.discount.coupon.percentOff + '% off until ' + moment($scope.discount.end).add(14, 'days').format('MMM Do, YYYY');
        }
        return $scope.discount.coupon.percentOff + '% off for ' + $scope.discount.coupon.durationInMonths + ' months';
      };
    }
  };
}
