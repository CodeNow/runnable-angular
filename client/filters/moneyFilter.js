'use strict';

require('app')
  .filter('centsToDollars', function () {
    return function formatMoney(cents) {
      if (typeof cents !== 'number') {
        return '';
      }
      var dollars = cents / 100;
      var decimalLength = 2;
      if (dollars % 1 === 0) {
        decimalLength = 0;
      }
      return dollars.toFixed(decimalLength);
    };
  });
