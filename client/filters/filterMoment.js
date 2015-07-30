'use strict';

require('app').filter('moment', function (moment) {
  return function timeFrom (date, format) {
    return (!date) ? undefined : moment(date).format(format);
  };
});
