'use strict';

require('app')
  .filter('money', function () {
    return function formatMoney(money) {
      if (!money) {
        return '';
      }
      var decimalLength = 2;
      if (money % 1 === 0) {
        decimalLength = 0;
      }
      return money.toFixed(decimalLength);
    };
  });
