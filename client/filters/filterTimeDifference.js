'use strict';

require('app')
  .filter('timeDifference', function (moment) {
    function timeDifference (date1, date2) {
      if (!date1 || !date2) {
        return;
      }

    }
    timeDifference.$stateful = true;
    return timeDifference;
  });
